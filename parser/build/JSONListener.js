// Generated from JSON.g4 by ANTLR 4.8
// jshint ignore: start
var antlr4 = require('antlr4/index');

// This class defines a complete listener for a parse tree produced by JSONParser.
function JSONListener() {
	antlr4.tree.ParseTreeListener.call(this);
	return this;
}

JSONListener.prototype = Object.create(antlr4.tree.ParseTreeListener.prototype);
JSONListener.prototype.constructor = JSONListener;

// Enter a parse tree produced by JSONParser#json.
JSONListener.prototype.enterJson = function(ctx) {
};

// Exit a parse tree produced by JSONParser#json.
JSONListener.prototype.exitJson = function(ctx) {
};


// Enter a parse tree produced by JSONParser#obj.
JSONListener.prototype.enterObj = function(ctx) {
};

// Exit a parse tree produced by JSONParser#obj.
JSONListener.prototype.exitObj = function(ctx) {
};


// Enter a parse tree produced by JSONParser#pair.
JSONListener.prototype.enterPair = function(ctx) {
};

// Exit a parse tree produced by JSONParser#pair.
JSONListener.prototype.exitPair = function(ctx) {
};


// Enter a parse tree produced by JSONParser#arr.
JSONListener.prototype.enterArr = function(ctx) {
};

// Exit a parse tree produced by JSONParser#arr.
JSONListener.prototype.exitArr = function(ctx) {
};


// Enter a parse tree produced by JSONParser#value.
JSONListener.prototype.enterValue = function(ctx) {
};

// Exit a parse tree produced by JSONParser#value.
JSONListener.prototype.exitValue = function(ctx) {
};



exports.JSONListener = JSONListener;