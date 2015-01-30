var s = [Snap(), Snap(), Snap()];
document.getElementById('graph-page').appendChild(s[0].node);
document.getElementById('grid-page').appendChild(s[1].node);
document.getElementById('point-page').appendChild(s[2].node);

var GraphDisplay = function(){
	this.graph = new Graph();
	this.snap = s[0];
	this.nodeIndex = 0;
	this.permaLines = this.snap.group();
	this.tempLines = this.snap.group();
	this.tempNodes = this.snap.group();
	this.permaNodes = this.snap.group();
	this.currentNode = '';
	this.currentLines = [];
	this.isDragging = false;
	this.connectedNodes = [];
}
GraphDisplay.prototype = {
	drawNode: function(x, y){
		this.tempNodes.circle(x, y, 0).attr({class: "graph-node", id: "node"+this.nodeIndex}).animate({r:10}, 100, mina.easeinout).drag(preDragMove, preDragStart, preDragEnd);
		this.graph.addNode(x, y, 1);
		this.nodeIndex++;
		var self = this;
		function preDragMove(dx, dy, x, y){self.dragMove(dx, dy, x, y, this)}
		function preDragStart(x, y){self.dragStart(x, y, this)}
		function preDragEnd(x, y){self.dragEnd(x, y, this)}
	},
	dragMove: function(dx, dy, x, y, node){
		node.attr({
            transform: node.data('origTransform') + (node.data('origTransform') ? "T" : "t") + [dx, dy]
        });
        thisID = node.node.id.slice(4);
        this.tempLines.clear();
        if(!this.isDragging){
        	this.isDragging = true;
        	var edges = this.graph.getNode(thisID).edges;
        	var lines = this.permaLines.selectAll('.line'+thisID).items;
        	for(line in lines) lines[line].remove();
        	for(edge in edges){
        		targetID = edges[edge].target.id
        		this.connectedNodes.push(targetID);
        	}
        }
        for(neighbor in this.connectedNodes){
        	current = this.connectedNodes[neighbor];
        	this.drawLineBetweenNodes(thisID, current, false);
        }

	},
	dragStart: function(nx, ny, node){
		node.data('origTransform', node.transform().local );
	},
	dragEnd: function(nx, ny, node){
		this.isDragging = false;
		thisID = node.node.id.slice(4);
		for(neighbor in this.connectedNodes){
        	current = this.connectedNodes[neighbor];
        	this.graph.disconnectNodes(thisID, current, true);
        	this.graph.connectNodes(thisID, current, this.getDistance(thisID, current), true);
        	this.drawLineBetweenNodes(thisID, current, true);
        }
        this.tempLines.clear();
		this.connectedNodes = [];
		var center = this.getCenter(thisID);
		this.graph.getNode(thisID).update({
			x: center[0],
			y: center[1]
		})
	},
	drawLineBetweenNodes: function(node1ID, node2ID, perma){
		var center1 = this.getCenter(node1ID);
		var center2 = this.getCenter(node2ID);
		if(perma){
			this.permaLines.line(center1[0], center1[1], center2[0], center2[1]).attr({class:"perma-line line"+node1ID+" line"+node2ID});
		}
		else{
			this.tempLines.line(center1[0], center1[1], center2[0], center2[1]).attr({class:"temp-line line"+node1ID+" line"+node2ID});
		}
	},
	drawLineFromNode: function(node1ID, x, y){
		var center1 = this.getCenter(node1ID);
		this.tempLines.line(center1[0], center1[1], x, y).attr({class:"temp-line"});
	},
	startConnect: function(nodeID){
		this.currentNode = nodeID;
		var self = this;
		this.snap.mousemove(watchMouse);
		function watchMouse(e){
			self.tempLines.clear();
			self.drawLineFromNode(nodeID, e.clientX, e.clientY);
		}
	},
	endConnect: function(nodeID){
		this.snap.unmousemove();
		this.tempLines.clear();
		if(nodeID == undefined) return;
		if(!this.graph.getNode(this.currentNode).isNeighbor(nodeID) && this.currentNode != nodeID){
			this.drawLineBetweenNodes(this.currentNode, nodeID, true);
			this.graph.connectNodes(this.currentNode ,nodeID, 1, true);	
		}
	},
	deleteLine: function(line, node1, node2){
		line.remove();
		this.graph.disconnectNodes(node1, node2, true);
	},
	getCenter: function(nodeID){
		var node = this.snap.select('#node'+nodeID);
		var bounding = node.getBBox();
		return [bounding.cx, bounding.cy];
	},
	getDistance: function(node1ID, node2ID){
		var center1 = this.getCenter(node1ID);
		var center2 = this.getCenter(node2ID);
		return Math.sqrt(Math.pow(center2[0]-center1[0], 2)+Math.pow(center2[1]-center1[1], 2));
	}

}

var gd = new GraphDisplay();
gd.drawNode(200, 200);
gd.drawNode(400, 200);
gd.startConnect(0);
gd.endConnect(1);
$('#graph-page').on('mousedown', graphClick);
$('#graph-page').on('mouseup', graphUnclick);

var clickx = 0;
var clicky = 0;
// 0: no connection activity, 1: Just connected, 2: Connect mode
var connectStatus = 0;
function graphClick(e){
	if(e.target.nodeName == 'circle'){
		if(connectStatus === 2){
			gd.endConnect(e.target.id.slice(4));
			connectStatus = 1;
		}
		clickx = e.clientX;
		clicky = e.clientY;
	}
	else if(connectStatus == 2){
			gd.endConnect();
			connectStatus = 0;
	}
	else if(e.target.nodeName === 'svg'){
		gd.drawNode(e.clientX, e.clientY);
	}
}
function graphUnclick(e){
	if(e.target.nodeName == 'circle'){
		if(clickx == e.clientX && clicky == e.clientY){
			if(connectStatus === 1){
				// console.log('Nodes Connected!');
				connectStatus = 0;
			}
			else{
				connectStatus = 2;
				gd.startConnect(e.target.id.slice(4));
			}
		}
		else{
			// console.log('Drag!');
		}
	}
	else if(e.target.nodeName =='line'){
		if(connectStatus === 2) return;
		classList = e.target.classList.toString().split(' ');
		gd.deleteLine(e.target, classList[1].slice(4), classList[2].slice(4));
	}
}

