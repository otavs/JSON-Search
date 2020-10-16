const antlr4 = require('antlr4/index')
const JSONLexer = require('parser/build/JSONLexer')
const JSONParser = require('parser/build/JSONParser')

const rootName = 'root'

const inputArea = document.querySelector('#input')
const searchInput = document.querySelector('#searchInput')
const resultsDiv = document.querySelector('#resultsDiv')

searchInput.addEventListener('keydown', e => {if(event.keyCode == 13) parse()})

let nodes = []

inputArea.value = 
`{
	"id": "0001",
	"type": "donut",
	"name": "Cake",
	"ppu": 0.55,
	"batters":
		{
			"batter":
				[
					{ "id": "1001", "type": "Regular" },
					{ "id": "1002", "type": "Chocolate" },
					{ "id": "1003", "type": "Blueberry" },
					{ "id": "1004", "type": "Devil's Food" }
				]
		},
	"topping":
		[
			{ "id": "5001", "type": "None" },
			{ "id": "5002", "type": "Glazed" },
			{ "id": "5005", "type": "Sugar" },
			{ "id": "5007", "type": "Powdered Sugar" },
			{ "id": "5006", "type": "Chocolate with Sprinkles" },
			{ "id": "5003", "type": "Chocolate" },
			{ "id": "5004", "type": "Maple" }
		]
}
`

function parse() {
	const input = inputArea.value
	const chars = new antlr4.InputStream(input)
	const lexer = new JSONLexer.JSONLexer(chars)
	const tokens  = new antlr4.CommonTokenStream(lexer)
	const parser = new JSONParser.JSONParser(tokens)
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
}

function visitJson(ctx) {
	nodes = []
	visitValue(ctx.children[0], createNode(rootName, 1))
}

function visitValue(ctx, parent, arrayIndex = '') {
	if(ctx.obj())
		visitObj(ctx.obj(), parent, arrayIndex)
	else if(ctx.arr())
		visitArr(ctx.arr(), parent, arrayIndex)
	else
		visitTerminal(ctx.children[0], parent, arrayIndex)
}

function visitObj(ctx, parent, arrayIndex = '') {
	for(const pair of ctx.pair())
		visitValue(pair.value(), createNode(pair.STRING().getText().slice(1, -1), pair.start.line, parent, arrayIndex))
}

function visitArr(ctx, parent, arrayIndex = '') {
	for(const i in ctx.value())
		visitValue(ctx.value()[i], parent, `${arrayIndex}[${i}]`)
}

function visitTerminal(ctx, parent, arrayIndex = '') {
	createNode(ctx.getText(), ctx.symbol.line, parent, arrayIndex, true)
}

function createNode(text, line, parent, arrayIndex = '', isTerminal) {
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
		res = `${node.parent.text}${node.arrayIndex}${node.isTerminal ? ': ' : '.'}${res}`
		node = node.parent
	}
	return res
}

function getTextsAndLines(node) {
	let res = [[node.text, node.line]]
	while(node.parent) {
		if(node.isTerminal) res.push([': '])
		else res.push(['.'])
		if(node.arrayIndex) res.push([node.arrayIndex])
		res.push([node.parent.text, node.parent.line])
		node = node.parent
	}
	return res
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
	const textsAndLines = getTextsAndLines(node).reverse()
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
	return span
}

