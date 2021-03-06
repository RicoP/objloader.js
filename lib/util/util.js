var UTIL = (function() {
"use strict"; 

//= ../glsafecontext.js/glsafecontext.js 
//= ../webgl-debug.js  
//= util.keyfuncs.js 
//= util.joyfuncs.js 
//= util.objparse.js 

var requestAnimationFrame = 
	window.requestAnimationFrame       || 
	window.webkitRequestAnimationFrame || 
	window.mozRequestAnimationFrame    || 
	window.oRequestAnimationFrame      || 
	window.msRequestAnimationFrame     || 
	function( callback ){
		window.setTimeout(callback, 1000 / 60);
	};

function createContext(width, height, node) { 	
		var canvas;
		node = node || document.body;  
		canvas = document.createElement("canvas"); 
		canvas.width = width || 640; 
		canvas.height = height || 480; 
		node.appendChild(canvas); 

		var names = [ "experimental-webgl", "webgl", "moz-webgl", "webkit-3d" ];
		var i; 
		var name; 	
		var gl; 
		for(i = 0; name = names[i++];) {
			gl = WebGLDebugUtils.makeDebugContext(canvas.getContext(name, {alpha : false, preserveDrawingBuffer : true}).getSafeContext()); 
			if(gl) {
				break; 
			}
		}

		return gl; 
}

function getSource(id) {
    var node = document.getElementById(id); 
    return node.innerText; 
}

function createCube() {
	var vert = new Float32Array([
		-1, -1,  1, 1,
		 1, -1,  1, 1,
		 1,  1,  1, 1,
		-1,  1,  1, 1,
		-1, -1, -1, 1,
		 1, -1, -1, 1,
		 1,  1, -1, 1,
		-1,  1, -1, 1
	]); 

	var n = 0.577350269; //sqrt(3) / 3

	var norm = new Float32Array([
		-n, -n,  n, 0,
		 n, -n,  n, 0,
		 n,  n,  n, 0,
		-n,  n,  n, 0,
		-n, -n, -n, 0,
		 n, -n, -n, 0,
		 n,  n, -n, 0,
		-n,  n, -n, 0
	]); 

	var indx = new Uint16Array([
		0,1,2,
		0,2,3,
		1,5,6,
		1,6,2,
		5,4,7,
		5,7,6,
		4,0,3,
		4,3,7,
		3,2,6,
		3,6,7,
		4,5,1,
		4,1,0
	]);

	return { vertices : vert, indices : indx, normals : norm };
}

function createPlane(level) {
    var vert = [];
    var tex = [];  

    createTriangle(vert, tex, [1,0,1], [-1,0,1], [-1,0,-1], [1,1], [0,1], [0,0], level || 0); 
    createTriangle(vert, tex, [1,0,1], [-1,0,-1], [1,0,-1], [1,1], [0,0], [1,0], level || 0); 

    return { vertices : new Float32Array(vert), texCoords : new Float32Array(tex) }; 

    function createTriangle(vert, tex, v1, v2, v3, t1, t2, t3, n) { 
        if(n === 0) {
            vert.push(v1[0], v1[1], v1[2], 1.0); 
            vert.push(v2[0], v2[1], v2[2], 1.0); 
            vert.push(v3[0], v3[1], v3[2], 1.0); 

            tex.push(t1[0], t1[1]); 
            tex.push(t2[0], t2[1]); 
            tex.push(t3[0], t3[1]); 

            return; 
        }

        var v12 = middleVec(v1, v2); 
        var v23 = middleVec(v2, v3); 
        var v31 = middleVec(v3, v1); 

        var t12 = middleTex(t1, t2); 
        var t23 = middleTex(t2, t3); 
        var t31 = middleTex(t3, t1); 

        createTriangle(vert, tex, v1, v12, v31, t1, t12, t31, n-1); 
        createTriangle(vert, tex, v2, v23, v12, t2, t23, t12, n-1); 
        createTriangle(vert, tex, v3, v31, v23, t3, t31, t23, n-1); 
        createTriangle(vert, tex, v12, v23, v31, t12, t23, t31, n-1); 

        function middleVec(v1, v2) {
            var x1,y1,z1,x2,y2,z2; 
            x1 = v1[0]; 
            y1 = v1[1]; 
            z1 = v1[2]; 
            x2 = v2[0]; 
            y2 = v2[1]; 
            z2 = v2[2]; 

            return [ (x1 + x2) / 2,  (y1 + y2) / 2,  (z1 + z2) / 2 ]; 
        }

        function middleTex(t1, t2) {
            var x1,y1,x2,y2; 

            x1 = t1[0];
            y1 = t1[1]; 
            x2 = t2[0];
            y2 = t2[1]; 

            return [ (x1 + x2) / 2, (y1 + y2) / 2 ]; 
        }
    }
}

var requestGameFrame = (function() {
	var starttime = -1; 
	var lasttime = 0;

	var time = {
		"delta" : 0, 
		"total" : 0
	};

	var loopObject = {
		"time" : time, 
		"frame" : 0, 
		"reset" : reset 
	};
	
	function reset() {
		starttime = -1;  
	}

	return function (callback) { 
		requestAnimationFrame(function () {
			var now = Date.now(); 
			if(starttime === -1) {
				lasttime = now;
				starttime = now; 
				loopObject.frame = 0; 
			}

			time.delta = (now - lasttime) / 1000.0; 
			time.total = (now - starttime) / 1000.0; 

			joyfuncs.update(); 

			callback(loopObject); 

			keyfuncs.setOldKeyState(); 
			lasttime = now; 
			loopObject.frame++;
		}); 
	};
}()); 

var shapes = {
	"createPlane" : createPlane, 
	"createCube" : createCube, 
};

// UTIL.keys.x.down
// UTIL.keys.x.up
// UTIL.keys.x.pressed
// UTIL.keys.x.released

var keys = {
	codes : function() { return keyfuncs.keys; }, 
	isDown : function() { return keyfuncs.keyisDown; }, 
	isUp : function() { return keyfuncs.keyisUp; }, 
	wasPressed : function() { return keyfuncs.keyWasPressed; }, 
	wasReleased : function() { return keyfuncs.keyWasReleased; } 
};

for(var kn in keyfuncs.keys) {
	(function(keyname, keycode) { 
		var funcs = {
			down : function() { return keyfuncs.keyIsDown(keycode); },
			up : function() { return keyfuncs.keyIsUp(keycode); },
			pressed : function() { return keyfuncs.keyWasPressed(keycode); },
			released : function() { return keyfuncs.keyWasReleased(keycode); },
		}; 

		Object.defineProperty(keys, keyname, {
			"get" : function() { return funcs; }  
		});
	}(kn, keyfuncs.keys[kn])); 
} 

var gamepads = {
	"first" : joyfuncs.getFirstPad
};

var obj = {
	"parse" : objparse.parse
}

return {
	"requestGameFrame" : requestGameFrame, 
	"createContext" : createContext,
	"getSource" : getSource,  
	"shapes" : shapes,
	"obj" : obj, 
	"keys" : keys,
	"gamepads" : gamepads
}; 
}()); 
