/**
 * @author Zachary Wartell, Jialei Li, K.R. Subrmanian
 * 
 */




/*****
 * 
 * GLOBALS
 * 
 *****/

var lastTimestamp=null;

var debug = {showDelta : false};
var repaint;

var paused = false;

var speed = 1; //Update to read from speed slider

/*****
 * 
 * MAIN
 * 
 *****/
function main() {
    
    /* uncomment to just run unit tests */
    var unitTest=false;
    //unitTest=true;
    if (unitTest)
    {
          Mat2_test();
          Mat3_test();
          //return;
    }
    
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
      
    /**
     **    Initialize some test Drawable's
     **/
    var shader = new Shader(gl, "vertex-shader", "fragment-shader");                       
    var renderables = new Array();
    
    modelViewStack = new Mat3Stack(gl);   
    
    /*     
     * Student Note: the conditionally executed calls below enable calls to various
     * testing functions in Tests.js.   See each function's description for details.
     * You can enable and disable calls to these functions to test various parts of your implementation
     * of math2D.js, Mat3Stack.js and the classes in Renderable.js
     * In your final version of Planet Mobile, these test code calls would be replaced by code that creates
     * and initializes all the planet objects in their CoordinateSystem tree.
     */
    {// begin test code
    if (0)
        SimpleRenderable_test1(renderables,shader);
    if (0)
        TestStack_test1(renderables,shader);
    if (0)
        CoordinateSystem_test1(renderables,shader,gl);
    if (0)
        CoordinateSystem_test2(renderables,shader,gl);    
    
    }// end test code
        
        
    var skeleton=false;
    if(skeleton)
    {
        document.getElementById("App_Title").innerHTML += "-Skeleton";
    }
    
    makeSystem(renderables, shader, gl); //Create the hierarchy

    /**
     **    Initialize Misc. OpenGL state
     **/
    gl.clearColor(0, 0, 0, 1);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    /**
     **      Set Event Handlers
     **
     **  Student Note: the WebGL book uses an older syntax. The newer syntax, explicitly calling addEventListener, is preferred.
     **  See https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
     **/
    // set event handlers buttons
    document.getElementById("PauseButton").addEventListener(
            "click",
            function () {
                console.log("PauseButton");
                if(!paused)
                	paused = true;
                else
                	paused = false;
            });                                     
                    
    // Register function (event handler) to be called on a mouse press
    canvas.addEventListener(
            "mousedown",
            function (ev) {
                handleMouseDown(ev, gl, canvas, renderables);
                });
                
                
    /**
     **   Initiate Animation Loop
     **/
    // define repaint function
    repaint = function(timestamp)
    {    		
        // draw and animate all objects for this frame
        if (lastTimestamp !== null) 
        {
            // update time info
            var
                delta = timestamp-lastTimestamp; // 'delta' = time that has past between this call and previous call to this repaint function
            lastTimestamp = timestamp;
            
            if(!paused)
            	rootCS.rotate(delta, speed);
            else
            	rootCS.rotate(delta, 0);
            
            // animate everything (i.e. update geometry, positions, colors, etc. of all Renderable objects                        
            animateFrame(renderables,delta);

            // draw everything
            drawFrame(gl,renderables);  
                        
            // some debug output           
            if (debug.showDelta)
                console.log("Delta: "+delta);
        }
        lastTimestamp = timestamp;
        
        // request another call to repaint function to render next frame
        requestAnimationFrame(repaint);
    };
    // make first call to repaint function
    requestAnimationFrame(repaint);
}



/*****
 * 
 * FUNCTIONS
 * 
 *****/


/* @author Zachary Wartell && ..
 * This function should update all geometry, positions, transforms, colors, etc. of all Renderable objects                         
 * 
 * @param {renderables} - array of all created ShaderRenderable objects
 * @param {delta} - time that has past since last rendered frame
 */
function animateFrame(renderables,delta)
{
    for (i=0;i<renderables.length;i++)
    	
    	
        if (renderables[i] instanceof ShaderRenderable)
            {
                renderables[i].color[0] += delta * 0.001;
                //clle.log(renderables[i].color[0]);
                if (renderables[i].color[0] > 1.0)
                    renderables[i].color[0] = 0.1;
                
                
            }           
}

/*
 * Handle mouse button press event.
 * 
 * @param {MouseEvent} ev - event that triggered event handler
 * @param {Object} gl - gl context
 * @param {HTMLCanvasElement} canvas - canvas 
 * @param {Array} renderables - Array of Drawable objects
 * @returns {undefined}
 */
function handleMouseDown(ev, gl, canvas, renderables) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
    
    // Student Note: 'ev' is a MouseEvent (see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)
    
    // convert from canvas mouse coordinates to GL normalized device coordinates
    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    console.log("click\n" +
                "  GUI: " + ev.clientX + ", " + ev.clientY + "\n" +
                "  NDC: " + x + ", " + y);
   
   // \todo test all Shape objects for selection using their point_inside method's    
    
    var sel = false;
    selectables.forEach(function (shape){
    	if (shape.point_inside(new Vec2([x,y])))
    	{
    		sel = shape;
    	}
    });
    
    if(sel){
    	document.getElementById("Selected").innerHTML = "Selected: " + sel.name;
    }
    
    else{
    	document.getElementById("Selected").innerHTML = "None";
    }
   requestAnimationFrame(repaint);
}

/* @author Zachary Wartell
 * Draw all Renderable objects 
 * @param {Object} gl - WebGL context
 * @param {Array} renderables - Array of Renderable objects
 * @returns {undefined}
 */
function drawFrame(gl, renderables) {

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // init model view stack
    //modelViewStack.loadIdentity();
    
    // draw all Renderable objects
    for(var i=0;i<renderables.length;i++)
        renderables[i].render();    
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

function makeSystem(renderables, shader, gl){
	/*
	 * Make Coordinate Systems
	 */
	rootCS = new CoordinateSystem(); //Root
	rootCS.setOrigin(new Vec2([0.0,0.0]));
	rootCS.setScale(new Vec2([1.0,1.0]));
	rootCS.setOrientation(0.0);
	
	solarSystemCS = new CoordinateSystem(); //Level 0
	solarSystemCS.setOrigin(new Vec2([0.0,0.0]));
	solarSystemCS.setScale(new Vec2([0.7,0.7]));
	solarSystemCS.setOrientation(0.0);
		
	sunCS = new CoordinateSystem();
	sunCS.setOrigin(new Vec2([0.0,0.0]));
	sunCS.setScale(new Vec2([0.6, 0.6]));
	sunCS.setOrientation(0.0);
	
	p1CS = new CoordinateSystem();
	p1CS.setOrigin(new Vec2([0.4,0.4]));
	p1CS.setScale(new Vec2([0.6, 0.6]));
	p1CS.setOrientation(0.0);
	
	p1Orbit = new CoordinateSystem();
	p1Orbit.setOrigin(new Vec2([0.2,0.2]));
	p1Orbit.setScale(new Vec2([0.5, 0.9]));
	p1Orbit.setOrientation(0.0);
	
	p1aCS = new CoordinateSystem();
	p1aCS.setOrigin(new Vec2([0.4,0.4]));
	p1aCS.setScale(new Vec2([0.4, 0.4]));
	p1aCS.setOrientation(0.0);
	
	p1aOrbit = new CoordinateSystem();
	p1aOrbit.setOrigin(new Vec2([0.01,0.01]));
	p1aOrbit.setScale(new Vec2([0.8, 0.8]));
	p1aOrbit.setOrientation(0.0);
	
	p1aaCS = new CoordinateSystem();
	p1aaCS = new CoordinateSystem();
	p1aaCS.setOrigin(new Vec2([0.02,0.02]));
	p1aaCS.setScale(new Vec2([1.0, 1.0]));
	p1aaCS.setOrientation(0.0);
	//Make Shapes

	//gl shader center radius numVerts color name
	sun = new UnitDisc(gl, shader, new Vec2([0.0, 0.0]), 0.30, 15, [1.0,1.0,0.0,1.0], "Sol");
	p1  = new UnitDisc(gl, shader, new Vec2([0.0, 0.0]), 0.10, 10, [1.0,0.0,1.0,1.0], "Gradus");
	p1a = new UnitDisc(gl, shader, new Vec2([0.0, 0.0]), 0.05, 07, [0.8,0.8,0.8,1.0], "Lunadus");
	p1aa = new UnitDisc(gl, shader, new Vec2([0.0, 0.0]), 0.05, 05, [1.0,1.0,1.0,1.0], "Traadus");
	
	//Add Shapes to CSs
	sunCS.add_shape(sun);
	p1CS.add_shape(p1);
	p1Orbit.add_shape(p1a);
	p1aOrbit.add_shape(p1aa);
	
	//Make CS Heirarchy
	rootCS.add_child(solarSystemCS);
	
	solarSystemCS.add_child(sunCS);
	solarSystemCS.add_child(p1CS);
	
	p1CS.add_child(p1Orbit);
	
	p1Orbit.add_child(p1aCS);
	
	p1aCS.add_child(p1aOrbit);
		
	console.log(rootCS);
	renderables.push(rootCS);
	selectables = rootCS.selectables(new Array());
}
