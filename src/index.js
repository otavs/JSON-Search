import './style.css'

import antlr4 from 'antlr4'
import JSONLexer from '../parser/build/JSONLexer'
import JSONParser from '../parser/build/JSONParser'

import CodeMirror from 'codemirror'
import 'codemirror/addon/selection/mark-selection'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/lib/codemirror.css'

import 'codemirror/addon/fold/brace-fold'
import 'codemirror/addon/fold/comment-fold'
import 'codemirror/addon/fold/foldcode'
import 'codemirror/addon/fold/foldgutter.css'
import 'codemirror/addon/fold/foldgutter'
import 'codemirror/addon/fold/indent-fold'
import 'codemirror/addon/fold/markdown-fold'
import 'codemirror/addon/fold/xml-fold'

import tippy from 'tippy.js'
import 'tippy.js/dist/tippy.css'

const rootName = 'root'

const searchInput = document.querySelector('#searchInput')
const resultsDiv = document.querySelector('#resultsDiv')
const inputArea = document.querySelector('#input')
const resultsLabel = document.querySelector('#resultsLabel')

searchInput.addEventListener('keydown', e => e.keyCode == 13 && parse())
document.querySelector('#searchButton').addEventListener('click', parse)
document.querySelector('#beautifyButton').addEventListener('click', beautify)

let nodes = [], lineMarker

import exampleJson from './example'

const codeMirror = CodeMirror(inputArea, {
	value: exampleJson,
	mode: 'application/ld+json',
	lineNumbers: true,
	// lineWrapping: true,
	styleSelectedText: true,
	foldGutter: true,
    gutters: [
		'CodeMirror-linenumbers', 
		'CodeMirror-foldgutter'
	],
	foldOptions: {
		widget: (from, to) => {
			// Get open / close token
			let startToken = '{', endToken = '}'
			const prevLine = codeMirror.getLine(from.line)
			if (prevLine.lastIndexOf('[') > prevLine.lastIndexOf('{'))
				startToken = '[', endToken = ']'
			// Get json content
			const internal = codeMirror.getRange(from, to)
			const toParse = startToken + internal + endToken
			// Get key count
			let count
			try {
				const parsed = JSON.parse(toParse)
				count = Object.keys(parsed).length
			} catch(e) { }        
			return count ? `\u21A4${count}\u21A6` : '\u2194'
		}
	}
})

function parse() {
	const input = codeMirror.getValue()
	if(!checkSyntax(input))
		return
	const chars = new antlr4.InputStream(input)
	const lexer = new JSONLexer(chars)
	const tokens  = new antlr4.CommonTokenStream(lexer)
	const parser = new JSONParser(tokens)
	parser.buildParseTrees = true
	const json = parser.json()
	visitJson(json)
	updateResults(searchNodes(searchInput.value))
	tippy('.showLine', {
		content: node => node.getAttribute('line'),
		delay: 0,
		animation: false,
		offset: [0, 9],
		hideOnClick: false,
	})
	resultsLabel.innerHTML = 'Results'
}

function goToLine(line) {
	lineMarker?.clear()
	lineMarker = codeMirror.markText({line: line-2}, {line: line-1}, {className: 'markedLine'})
	codeMirror.scrollIntoView({
		line: line-1,
		ch: 0
	}, codeMirror.getScrollInfo().clientHeight / 2)
}

function visitJson(ctx) {
	nodes = []
	visitValue(ctx.value(), createNode(rootName, ctx.start.line))
}

function visitValue(ctx, parent, arrayIndex = []) {
	if(ctx.obj())
		visitObj(ctx.obj(), parent, arrayIndex)
	else if(ctx.arr())
		visitArr(ctx.arr(), parent, arrayIndex)
	else
		visitTerminal(ctx.children[0], parent, arrayIndex)
}

function visitObj(ctx, parent, arrayIndex = []) {
	for(const pair of ctx.pair())
		visitValue(pair.value(), createNode(pair.STRING().getText().slice(1, -1), pair.start.line, parent, arrayIndex, false))
}

function visitArr(ctx, parent, arrayIndex = []) {
	ctx.value().forEach((value, i) => {
		visitValue(value, parent, [...arrayIndex, {index: i, line: value.start.line}])
	})
}

function visitTerminal(ctx, parent, arrayIndex = []) {
	createNode(ctx.getText(), ctx.symbol.line, parent, arrayIndex, true)
}

function createNode(text, line, parent, arrayIndex = [], isTerminal) {
	const node = {text, line, parent, arrayIndex, isTerminal}
	nodes.push(node)
	return node
}

function searchNodes(searchVal) {
	return nodes.filter(node => node.text.toLowerCase().indexOf(searchVal.toLowerCase()) > -1)
}

function getPathOfNode(node) {
	let res = node.text
	while(node.parent) {
		const indexListStr = node.arrayIndex.reduce((acc, {index}) => `${acc}[${index}]`, '')
		res = `${node.parent.text}${indexListStr}${node.isTerminal ? ': ' : '.'}${res}`
		node = node.parent
	}
	return res
}

function getTextsAndLines(node) {
	const res = []
	while(node) {
		res.push([node.text, node.line])
		if(node.parent) {
			if(node.isTerminal) res.push([': '])
			else res.push(['.'])
		}
		if(node.arrayIndex.length) {
			for(const {index, line} of node.arrayIndex.reverse())
				res.push([`[${index}]`, line])
		}
		node = node.parent
	}
	return res.reverse()
}

function getPathOfNodes(nodes) {
	return nodes.map(node => getPathOfNode(node))
}

function updateResults(nodes) {
	resultsDiv.innerHTML = ''
	for(const node of nodes)
		resultsDiv.appendChild(createDiv(node))
}

function createDiv(node) {
	const div = document.createElement('div')
	const textsAndLines = getTextsAndLines(node)
	for(const [text, line] of textsAndLines)
		if(line) div.appendChild(createSpan(text, line))
		else div.appendChild(createText(text))
	div.classList.add('result')
	return div
}

function createText(text) {
	return document.createTextNode(text) 
}

function createSpan(text, line) {
	const span = document.createElement('span')
	span.innerHTML = text
	span.setAttribute('line', `Line ${line}`)
	span.classList.add('showLine')
	span.addEventListener('click', () => goToLine(line))
	return span
}

function checkSyntax(input) {
	try {
		JSON.parse(input)
		return true
	} catch (e) {
		if(e instanceof SyntaxError)
			alert('Syntax error in JSON')
		return false
	}
}

function beautify() {
	try {
		codeMirror.setValue(JSON.stringify(JSON.parse(codeMirror.getValue()), null, 4))
	} catch (e) {
		if(e instanceof SyntaxError)
			alert('Syntax error in JSON')
		throw e
	}
}