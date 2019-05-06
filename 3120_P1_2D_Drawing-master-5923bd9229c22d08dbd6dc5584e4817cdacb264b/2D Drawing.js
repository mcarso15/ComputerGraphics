/**
 * @author Jialei Li, K.R. Subrmanian, Zachary Wartell
 * 
 * 
 */




/*****
 * 
 * GLOBALS
 * 
 *****/

// 'draw_mode' are names of the different user interaction modes.

var draw_mode = {DrawLines: 0, DrawTriangles: 1, ClearScreen: 2, None: 3, DrawQuads: 4};

// 'curr_draw_mode' tracks the active user interaction mode
var curr_draw_mode = draw_mode.DrawLines;

// GL array buffers for points, lines, and triangles

var vBuffer_Pnt, vBuffer_Line, vBuffer_Tri, vBuffer_Quad;

// Array's storing 2D vertex coordinates of points, lines, triangles, etc.
// Each array element is an array of size 2 storing the x,y coordinate.

var points = [], line_verts = [], tri_verts = [], quad_verts = [];

var closestLineVerts = [], closestTriangleVerts = [], closestQuadVerts = [];
// count number of points clicked for new line
var num_pts_line = 0;

var num_pts_tri = 0;

var num_pts_quad = 0;



var blueSlider, redSlider, greenSlider; //Variables for referencing HTML sliders

var rgbLine = [], rgbTri = [], rgbQuad = []; //Store the RGB value of each 'shape' classification
/*****
 * 
 * MAIN
 * 
 *****/
function main() {
    
    //math2d_test();
    
    /**
     **      Initialize WebGL Components
     **/
    
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShadersFromID(gl, "vertex-shader", "fragment-shader")) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // create GL buffer objects
    vBuffer_Pnt = gl.createBuffer();
    if (!vBuffer_Pnt) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    vBuffer_Line = gl.createBuffer();
    if (!vBuffer_Line) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    var skeleton=true;
    if(skeleton)
    {
        document.getElementById("App_Title").innerHTML += "-Skeleton";
    }

    vBuffer_Tri = gl.createBuffer();
    if (!vBuffer_Tri) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    
    vBuffer_Quad = gl.createBuffer();
    if (!vBuffer_Quad) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // get GL shader variable locations
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }

    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    /**
     **      Set Event Handlers
     **
     **  Student Note: the WebGL book uses an older syntax. The newer syntax, explicitly calling addEventListener, is preferred.
     **  See https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
     **/
    // set event handlers buttons
    document.getElementById("LineButton").addEventListener(
            "click",
            function () {
                curr_draw_mode = draw_mode.DrawLines;
            });

    document.getElementById("TriangleButton").addEventListener(
            "click",
            function () {
                curr_draw_mode = draw_mode.DrawTriangles;
            });
    
    document.getElementById("QuadButton").addEventListener(
            "click",
            function () {
                curr_draw_mode = draw_mode.DrawQuads;
            });
    
    document.getElementById("ClearScreenButton").addEventListener(
            "click",
            function () {
                curr_draw_mode = draw_mode.ClearScreen;
                // clear the vertex arrays
                while (points.length > 0)
                    points.pop();
                while (line_verts.length > 0)
                    line_verts.pop();
                while (tri_verts.length > 0)
                    tri_verts.pop();

                gl.clear(gl.COLOR_BUFFER_BIT);
                
                curr_draw_mode = draw_mode.DrawLines;
            });
            
    
    document.getElementById("DeleteButton").addEventListener("click",
    		
    		function() { //Not working, might not be handling closest verts correctly
    			if(closestLineVerts.length){
    				for(var i = 0; i < closestLineVerts.length; i++){
    					line_verts.splice(line_verts.indexOf(closestLineVerts[i]),1);
    				}
    			}
    			
    			else if(closestTriangleVerts.length){
    				for(var i = 0; i < closestTriangleVerts.length; i++){
    					tri_verts.splice(tri_verts.indexOf(closestTriangleVerts[i]), 1);
    				}
    				
    			}
    			else if(closestQuadVerts.length){
    				
    			}
    			
    			drawObjects(gl,a_Position, u_FragColor);
    	
    });

    // set event handlers for color sliders
    document.getElementById("RedRange").addEventListener(
            "input",
            function () {                
                redSlider.min = 0;
                redSlider.max = 1;
                redSlider.step = 0.1;
            });
    document.getElementById("GreenRange").addEventListener(
            "input",
            function () {
                greenSlider.min = 0;
                greenSlider.max = 1;
                greenSlider.step = 0.1;
            });
    document.getElementById("BlueRange").addEventListener(
            "input",
            function () {
                blueSlider.min = 0;
                blueSlider.max = 1;
                blueSlider.step = 0.1;
            });                        
            
    // init sliders 
    redSlider = document.getElementById("RedRange");
    document.getElementById("RedRange").value = 0;
    greenSlider = document.getElementById("GreenRange");
    document.getElementById("GreenRange").value = 0;
    blueSlider = document.getElementById("BlueRange");
    document.getElementById("BlueRange").value = 0;
    
    //Remove context menu within the canvas to not obstruct view
    canvas.addEventListener('contextmenu', event => event.preventDefault());
            
    // Register function (event handler) to be called on a mouse press
    canvas.addEventListener(
            "mousedown",
            function (ev) {
                handleMouseDown(ev, gl, canvas, a_Position, u_FragColor);
                });
}

/*****
 * 
 * FUNCTIONS
 * 
 *****/

/*
 * Handle mouse button press event.
 * 
 * @param {MouseEvent} ev - event that triggered event handler
 * @param {Object} gl - gl context
 * @param {HTMLCanvasElement} canvas - canvas 
 * @param {Number} a_Position - GLSL (attribute) vertex location
 * @param {Number} u_FragColor - GLSL (uniform) color
 * @returns {undefined}
 */
function handleMouseDown(ev, gl, canvas, a_Position, u_FragColor) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
    
    
    
    // Student Note: 'ev' is a MouseEvent (see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)
    
    // Get which button was clicked. 0 = Left, 1 = Middle, 2 = Right
    var bp = ev.button;
    
    // convert from canvas mouse coordinates to GL normalized device coordinates
    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
    if (bp == 2){
    	points.length = 0;
    	
    	//Find closest line if there are any
    	if(line_verts.length){
    		
        	var distanceFromLine = pointLineDist(line_verts[0], line_verts[1], [x,y]);
    		for(var i = 2; i < line_verts.length; i+=2){
    			distanceFromLine2 = pointLineDist(line_verts[i], line_verts[i+1], [x,y]);
    			if (distanceFromLine2 < distanceFromLine){
    				distanceFromLine = distanceFromLine2;
    				closestLineVerts[0] = line_verts[i];
    				closestLineVerts[1] = line_verts[i+1];
    			}
    		}
    		
    	}
    	
    	//Figure out if I'm in a triangle if there are any
    	if(tri_verts.length){    		
    		
        	var baryCoords = [];
        	var withinTriangle = false;
    		for(var j = 0; j < tri_verts.length; j+=3){
    			baryCoords = barycentric(tri_verts[j], tri_verts[j+1], tri_verts[j+2], [x,y]);
    			if(0 <= baryCoords[0] && 0 <= baryCoords[1] && 0 <= baryCoords[2] && baryCoords[0] <= 1 && baryCoords[1] <= 1
    					&& baryCoords[2] <= 1){
    				withinTriangle = true;
    				closestTriangleVerts[0] = tri_verts[j];
    				closestTriangleVerts[1] = tri_verts[j+1];
    				closestTriangleVerts[2] = tri_verts[j+2];
    				j = tri_verts; // Break the search loop if we pass
    			}
    		}
    	}
    	//Figure out if I'm in a quad if there are any
    	
    	if(quad_verts.length){
        	
        	var baryCoords = [];
        	var withinQuad = false;
        	
        	for(var j = 0; j < quad_verts.length; j+=4){
    			baryCoords = barycentric(quad_verts[j], quad_verts[j+1], quad_verts[j+2], [x,y]);
    			if(0 <= baryCoords[0] && 0 <= baryCoords[1] && 0 <= baryCoords[2] && baryCoords[0] <= 1 && baryCoords[1] <= 1
    					&& baryCoords[2] <= 1){
    				withinQuad = true;
    				closestQuadVerts[0] = quad_verts[j];
    				closestQuadVerts[1] = quad_verts[j+1];
    				closestQuadVerts[2] = quad_verts[j+2];
    				closestQuadVerts[3] = quad_verts[j+3];
    				j = quad_verts; // Break the search loop if we pass
    			}
    			
    			else {
    				baryCoords = barycentric(quad_verts[j+1], quad_verts[j+2], quad_verts[j+3], [x,y]);
        			if(0 <= baryCoords[0] && 0 <= baryCoords[1] && 0 <= baryCoords[2] && baryCoords[0] <= 1 && baryCoords[1] <= 1
        					&& baryCoords[2] <= 1){
        				withinQuad = true;
        				closestQuadVerts[0] = quad_verts[j];
        				closestQuadVerts[1] = quad_verts[j+1];
        				closestQuadVerts[2] = quad_verts[j+2];
        				closestQuadVerts[3] = quad_verts[j+3];
        				j = quad_verts; // Break the search loop if we pass
        			}
    			}
    		}
        	
        }
    	
    	var selectedVerts = [];
    	
    	if (closestLineVerts.length && distanceFromLine < .25){
    		selectedVerts = closestLineVerts;
    		redSlider.value = rgbLine[0];
    		greenSlider.value = rgbLine[1];
    		blueSlider.value = rgbLine[2];
    	}
    	
    	else if(closestTriangleVerts.length){
    		selectedVerts = closestTriangleVerts;
    		redSlider.value = rgbTri[0];
    		greenSlider.value = rgbTri[1];
    		blueSlider.value = rgbTri[2];
    	}
    	
    	else if(closestQuadVerts.length){
    		selectedVerts = closestQuadVerts;
    		redSlider.value = rgbQuad[0];
    		greenSlider.value = rgbQuad[1];
    		blueSlider.value = rgbQuad[2];
    	}
    	for(var i = 0; i < selectedVerts.length; i++){
    		points[i] = selectedVerts[i];
    	}
    	drawObjects(gl, a_Position, u_FragColor);
    }
    
    
    else{

    	if (curr_draw_mode !== draw_mode.None) {
        	// add clicked point to 'points'
        	points.push([x, y]);
    	}

    	// perform active drawing operation
    	switch (curr_draw_mode) {
        	case draw_mode.DrawLines:
            	// in line drawing mode, so draw lines
            	if (num_pts_line < 1) {			
                	// gathering points of new line segment, so collect points
                	line_verts.push([x, y]);
                	num_pts_line++;	
            	}
            	else {						
                	// got final point of new line, so update the primitive arrays
                	line_verts.push([x, y]);
                	rgbLine = [redSlider.value, greenSlider.value, blueSlider.value];
                	num_pts_line = 0;
                	points.length = 0;
            	}
            	break;
            	
        	case draw_mode.DrawTriangles:
        		//Draw triangles
        		if (num_pts_tri < 2){
        			tri_verts.push([x,y]);
        			num_pts_tri++;
        		}
        		else {
        			tri_verts.push([x,y]);
        			rgbTri = [redSlider.value, greenSlider.value, blueSlider.value];
        			num_pts_tri = 0;
        			points.length = 0;
        		}
        		break;
        	case draw_mode.DrawQuads:
        		if (num_pts_quad < 3){
        			quad_verts.push([x,y]);
        			num_pts_quad++;
        		}
        		else {
        			quad_verts.push([x,y]);
        			rgbQuad = [redSlider.value, greenSlider.value, blueSlider.value];
        			num_pts_quad = 0;
        			points.length = 0;
        		}
        		break;
        	
    	}
    	
    	drawObjects(gl,a_Position, u_FragColor);
    }
}

/*
 * Draw all objects
 * @param {Object} gl - WebGL context
 * @param {Number} a_Position - position attribute variable
 * @param {Number} u_FragColor - color uniform variable
 * @returns {undefined}
 */
function drawObjects(gl, a_Position, u_FragColor) {

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // draw lines
    if (line_verts.length) {	
        // enable the line vertex
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Line);
        // set vertex data into buffer (inefficient)
        gl.bufferData(gl.ARRAY_BUFFER, flatten(line_verts), gl.STATIC_DRAW);
        // share location with shader
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.uniform4f(u_FragColor, rgbLine[0], rgbLine[1], rgbLine[2], 1.0);
        // draw the lines
        gl.drawArrays(gl.LINES, 0, line_verts.length );        
    }

    // draw triangles
    if (tri_verts.length){
    		gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Tri);
    		gl.bufferData(gl.ARRAY_BUFFER, flatten(tri_verts), gl.STATIC_DRAW);
    	
    		gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    		gl.enableVertexAttribArray(a_Position);
    	
    		gl.uniform4f(u_FragColor, rgbTri[0], rgbTri[1], rgbTri[2], 1.0);
    		gl.drawArrays(gl.TRIANGLES, 0, tri_verts.length);
    }
   //TODO Fix unintended n-vertex shapes
   // draw quads
    if (quad_verts.length){ 
    	gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Quad);
		gl.bufferData(gl.ARRAY_BUFFER, flatten(quad_verts), gl.STATIC_DRAW);
	
		gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(a_Position);
	
		gl.uniform4f(u_FragColor, rgbQuad[0], rgbQuad[1], rgbQuad[2], 1.0);
		gl.drawArrays(gl.TRIANGLE_FAN, 0, quad_verts.length);
    }
    // draw primitive creation vertices 
    if (points.length !== 0)
    {
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Pnt);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
        gl.drawArrays(gl.POINTS, 0, points.length);    
    }
}

/**
 * Converts 1D or 2D array of Number's 'v' into a 1D Float32Array.
 * @param {Number[] | Number[][]} v
 * @returns {Float32Array}
 */
function flatten(v)
{
    var n = v.length;
    var elemsAreArrays = false;

    if (Array.isArray(v[0])) {
        elemsAreArrays = true;
        n *= v[0].length;
    }

    var floats = new Float32Array(n);

    if (elemsAreArrays) {
        var idx = 0;
        for (var i = 0; i < v.length; ++i) {
            for (var j = 0; j < v[i].length; ++j) {
                floats[idx++] = v[i][j];
            }
        }
    }
    else {
        for (var i = 0; i < v.length; ++i) {
            floats[i] = v[i];
        }
    }

    return floats;
}
