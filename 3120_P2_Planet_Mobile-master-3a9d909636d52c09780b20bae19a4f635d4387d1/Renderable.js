/* 
 * @author Zachary Wartell && 
 */

/*****
 * 
 * GLOBALS
 * 
 *****/

/*
 * modelviewStack serves as a modelView matrix stack
 * 
 * This should be initialize in main().
 * @type Mat3Stack
 */
var modelViewStack;

/*****
 * 
 * Object Prototypes
 * 
 *****/

/*
 * Constructor for Shader specific Exception
 * @returns {ShaderException}
 */
function ShaderException() {   
   this.name = "ShaderException";
}

/* @author Zachary Wartell
 * Constructor new Shader Object
 * 
 * Shader is a minimalist Object that encapsulates a GLSL Shader Program.
 * A Shader Object is used and shared by one or more objects of class Renderable.
 * 
 * Shader makes the assumption the associated GLSL shader code has a set of several
 * attribute and uniform variables.  See the constructor code for details.
 * 
 * Option I:
 * @param {Object} gl - WebGLContext
 * @param {String} vshaderID - vertex shader source code's HTML Element ID
 * @param {String} fshaderID - fragment shader source code's HTML Element ID
 * 
 * Option II:
 * @param {Object} gl - WebGLContext
 * @param {String} vshaderSrc - vertex shader source code stored as String
 * @param {String} fshaderSrc - fragment shader source code stored as String
 * @param {bool} - value should be true
 * 
 */
var Shader = function()
{    
    var gl;
    
    if (arguments.length === 3) 
    {// handle Option I arguements
        gl = arguments [0];
        var vshaderID = arguments[1];
        var fshaderID = arguments[2];
        
        /*
         *  create GLSL Program
         */     
        var vertElem = document.getElementById(vshaderID);
        if (!vertElem) {
            alert("Unable to load vertex shader " + vshaderID);
            return false;
        }

        var fragElem = document.getElementById(fshaderID);
        if (!fragElem) {
            alert("Unable to load vertex shader " + fshaderID);
            throw new ShaderException();        
        }

        this.program = createProgram(gl, vertElem.text, fragElem.text);
        if (!this.program) {
            alert('Failed to create program');
            throw new ShaderException();
        }            
    } else if (arguments.length === 4)    
    {// handle Option II arguements        
        gl = arguments[0];
        this.program = createProgram(gl, arguments[1], arguments[2]);
        if (!this.program) {
            alert('Failed to create program');
            throw new ShaderException();
        }                    
    }
    else 
        throw new Error("Unsupported Type");
    
    /*
     *  get GL shader variable locations
     */ 
    this.a_Position = gl.getAttribLocation(this.program, 'a_Position');
    if (this.a_Position < 0) {
        alert('Failed to get the storage location of a_Position');
        throw new ShaderException();
    }
    
    /*
     *  This uniform is designed to be manipulated by a Mat3Stack Object, rather than
     *  directly by methods in class Shader or class SimpleRenderable
     */
    this.u_modelView = gl.getUniformLocation(this.program, 'u_modelView');
    if (this.u_modelView < 0) {
        alert('Failed to get the storage location of u_modelView');
        throw new ShaderException();
    }    

    this.u_FragColor = gl.getUniformLocation(this.program, 'u_FragColor');
    if (!this.u_FragColor) {
        alert('Failed to get the storage location of u_FragColor');
        throw new ShaderException();
    }    

    this.gl = gl;
};

/* @author Zachary Wartell
 * Construct new Renderable Object
 * 
 * Renderable is an abstract class.  It has a method, 'render()' which draws something to the OpenGL Canvas
 *   
 */
var Renderable = function()
{    
};

/* @author Zachary Wartell
 * 
 * render this Renderable
 */
Renderable.prototype.render = function ()
{
    throw new Error("Unimplemented abstract class method");
    return;
};

/* @author Zachary Wartell
 * Construct new ShaderRenderable Object
 * 
 * ShaderRenderable is a minimalist Object that uses a GL Shader Program encapsulated in a Shader Object
 * and a global Mat3Stack, called modelViewMatrix, for managing the model view transform.
 * 
 * Multiple ShaderRenderable's can share a common Shader object.
 * 
 * A ShaderRenderable's associated Shader Object must:
 *      - contain a property .u_modelView that is a WebGLUniformLocation
 *      - this WebGLUniformLocation must be associated with a uniform mat3 called u_modelView in the vertex shader
 *        that is used for the model view transform 
 * 
 * A sub-class's .render method must call the ShaderRenderable.render_begin() method.
 * 
 * @param {Object} shader - a Shader object
 */
var ShaderRenderable = function(shader)
{    
    Renderable.call(this); // call parent class constructor
    this.shader = shader;
};
ShaderRenderable.prototype = Object.create(Renderable.prototype);//ShaderRenderable inherits from Renderable

/* @author Zachary Wartell
 * 
 * This method must be called by ShaderRenderable sub-classes .render method.
 */
ShaderRenderable.prototype.render_begin = function ()
{        
    var gl = this.shader.gl;
    
    // enable shader
    gl.useProgram(this.shader.program);
    
    // update modelView uniform
    modelViewStack.updateShader(this.shader.u_modelView);
};

/* @author Zachary Wartell
 * Construct new SimpleRenderable Object
 * 
 * SimpleRenderable inherits from ShaderRenderable.
 * SimpleRenderable encapsulates a GL Shader Program and further adds vertex information.
 *  
 * Note, multiple SimpleRenderable's can share a common Shader object.
 * 
 * Student Note:  Feel free to modify this class as needed OR create a new sub-class of ShaderRenderable using SimpleRenderable as guide.
 *  
 * @param {Object} shader - a Shader object
 */
var SimpleRenderable = function(shader)
{    
    ShaderRenderable.call(this,shader); // call parent class constructor
    
    var gl = this.shader.gl;
    
    /* color to use for this SimpleRenderable */
    this.color = new Float32Array(4);
    /* Array of 2D vertex coordinates (each coordinate is Array size 2) */
    this.vertices = new Array();   
    /* default GL primitive type */
    this.primitive = gl.TRIANGLES;
        
    /*
     *  create GL buffer (but don't transfer data into it, see updateBuffers).
     */     
    this.vertexBuffer = gl.createBuffer();
    if (!this.vertexBuffer) {
        alert('Failed to create the buffer object');
        throw new ShaderException();
    }      
};
SimpleRenderable.prototype = Object.create(ShaderRenderable.prototype); //SimpleRenderable inherits from ShaderRenderable

/* @author Zachary Wartell
 * update the GL buffers based on the current JS vertex data
 * 
 * updateBuffers only has to be called if/when the JS vertex data changes.
 * (Further, for GL efficiency it should only be called when needed).
 * 
 * preconditions:  GLSL program and vertex buffer are already created
 */
SimpleRenderable.prototype.updateBuffers = function ()
{
    var gl = this.shader.gl;
        
    // bind to the GL ARRAY_BUFFER
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    // copy vertex data into ARRAY_BUFFER
    gl.bufferData(gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW);
};

/* @author Zachary Wartell
 * draw this SimpleRenderable
 * 
 * preconditions:  GLSL program and vertex buffer are already created
 * @returns {undefined}
 */
SimpleRenderable.prototype.render = function ()
{
    this.render_begin();
   
    var gl = this.shader.gl;
               
    // draw primitives
    if (this.vertices.length) 
    {	                
        // bind the vertex buffer to the GL ARRAY_BUFFER 
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

        // use the vertexBuffer for the vertex attribute variable 'a_Position'
        gl.vertexAttribPointer(this.shader.a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.shader.a_Position);
        
        // set the various uniform variables
        gl.uniform4fv(this.shader.u_FragColor,this.color);    
       
        // draw the triangles
        gl.drawArrays(this.primitive, 0, this.vertices.length);
    }    
};

/* @author Zachary Wartell && ...
 * Construct new CoordinateRenderable Object
 * 
 * CoordinateRenderable is a abstract class. It inherits from Renderable and its geometric coordinates are all measured relative to a single 
 * coordinate system.  The coordinate system is described by an object of type CoordinateSystem, stored in this.parent.
*/
var CoordinateRenderable = function()
{
    Renderable.call(this);  // call parent class constructor
    this.parent = null;
};
CoordinateRenderable.prototype = Object.create(Renderable.prototype);

/* @author Zachary Wartell && ...
 * Construct new CoordinateSystem Object
 * 
 * CoordinateSystem inherits from CoordinateRenderable.  CoordinateSystem represents a 2d coordinate system
 * It has child objects of type CoordinateSystem and type Shape.
 * 
 * Details of the design of CoordinateSystem are described in the assignment description and related lectures.
*/
var CoordinateSystem = function()
{
    CoordinateRenderable.call(this);  // call parent class constructor
    
    // these properties describe where this CoordinateSystem is relative to it's parent CoordinateSystem 
    this.origin = new Vec2();       // location of origin
    this.scale = new Vec2([1,1]);   // scale factors
    this.orientation = 0.0;         // orientation (i.e. rotation)
    
    /* \todo add code as need to implement rest of CoordinateSystem class concepts */
    
    this.children = new Array();
    this.shapes = new Array();
};
CoordinateSystem.prototype = Object.create(CoordinateRenderable.prototype);

/* @author Zachary Wartell
 *
 * Return a Mat3 transform that maps local to parent coordinates, i.e. using the course lecture notation:
 * 
 *       M
 *        parent<-local
 *  
 *  @returns {Mat3}
 *  
 * Remark: Method Name
 *      The method name here, "parent_from_local", is meant to be a visual approximation to something like "parent<-local"
 *      It is tempting to name this method "parent_to_local" instead, but that would be an fundamental math _error_ because the
 *      matrix that transforms "parent to local" is:
 *
 *      M
 *        local<-parent
 *  
 *      which is the inverse the matrix this method is suppose to compute.
 *
 *      If JavaScript and all it's tools allowed programmers to use a left-arrow character as part of the identifier name (such Unicode character
 *      U+219x or ←), I would happily rename "parent_from_local" to be "parent←local".   But doing so at this stage in JavaScript's history
 *      has too many other problems.  So we have to live with "parent_from_local"
 *                        
 * 
 */
CoordinateSystem.prototype.parent_from_local = function ()
{
    var M = new Mat3();
    M.setTranslate([this.origin.x,this.origin.y]);
    M.rotate(this.orientation);
    M.scale([this.scale.x,this.scale.y]);
    return M;          
};

/* @author 
 * 
 * Return a Mat3 transform that maps parent to local coordinates, i.e. using the course's notation:
 * 
 *       M
 *        local<-parent
 *        
 * @returns {Mat3}
 */
CoordinateSystem.prototype.local_from_parent = function ()
{
	var M = math.inv(parent_from_local());
};

/* @author 
 *
 * Return a Mat3 transform that maps local to world coordinates, i.e. using the course's notation:
 * 
 *     M
 *      world<-local
 *  
 * @returns {Mat3}
 */
CoordinateSystem.prototype.world_from_local = function ()
{
	if (this.parent == null) {
	    return this.parent_from_local();
	  } else {
	    return this.parent.world_from_local().multiply(this.parent_from_local());
	  }
};

/* @author 
 *
 * Return a Mat3 transform that maps world to local coordinates, i.e. using the course's notation:
 * 
 *       M
 *        local<-world
 *        
 *  @returns {Mat3}
 */
CoordinateSystem.prototype.local_from_world = function ()
{
	if (this.parent == null) {
	    return this.local_from_parent();
	  } else {
	    return this.local_from_parent().multiply(this.parent.local_from_world());
	  }
};

/*
 * Recursively traverse the tree structure rendering all children coordinate systems and all shapes.
 * @returns {undefined}
 */
CoordinateSystem.prototype.render = function ()
{
	modelViewStack.push();
	modelViewStack.transform(this.parent_from_local());

	var children = this.children;
	Object.keys(children).forEach(function (key) {
	  children[key].render();
	});

	var shapes = this.shapes;
	Object.keys(shapes).forEach(function (key) {
	  shapes[key].render();
	});
	
	modelViewStack.pop();
};

/*
 * Attach the shape 'shape' to this CoordinateSystem's shapes
 * @param {Shape} shape
 * @returns {undefined}
 */
CoordinateSystem.prototype.add_shape = function (shape)
{
	this.shapes.push(shape);
    
};

/*
 * Attach the CoordinateSystem 'child' to this CoordinateSystem's children
 * @param {CoordinateSystem} child
 * @returns {undefined}
 */
CoordinateSystem.prototype.add_child = function (child)
{
    this.children.push(child);
    child.parent = this;
};

/* \todo add other CoordinateSystem methods as needed */
CoordinateSystem.prototype.setOrigin = function (origin){
	this.origin = origin;
};

CoordinateSystem.prototype.setScale = function (scale){
	this.scale = scale;
};

CoordinateSystem.prototype.setOrientation = function (orientation){
	this.orientation = orientation;
};

CoordinateSystem.prototype.rotate = function (delta, speed){
	this.orientation = (this.orientation + (delta * speed)/10) % 360;
	
	var children = this.children;
	Object.keys(children).forEach(function (key) {
		children[key].rotate(delta, speed);
	});
};

CoordinateSystem.prototype.selectables = function (array) {
	  var children = this.children;
	  Object.keys(children).forEach(function (key) {
	    children[key].selectables(array);
	  });
	  
	  var shapes = this.shapes;
	  Object.keys(shapes).forEach(function (key) {
	    if (shapes[key].selectable == true) {
	      array.push(shapes[key]);
	    }
	  });

	  return array;
};

/* @author Zachary Wartell && ...
 * Constructor new Shape Object
 * 
 * Shape is an abstract class. It inherits from CoordinateRenderable
 * Shape has several additional methods.
*/
var Shape = function()
{
    CoordinateRenderable.call(this); // call base class constructor
};
Shape.prototype = Object.create(CoordinateRenderable.prototype);//Shape inherits from CoordinateRenderable

/* @author Zachary Wartell
 * 
 * Return whether the point 'point_wcs' given in World Coordinates is inside
 * the boundaries of this Shape
 * 
 * @param {Vec2} point_wcs
 * @returns {Boolean}
 */
Shape.prototype.point_inside = function (point_wcs)
{
    throw new Error("Unimplemented abstract class method");
    return false;    
};

/* \todo add Shape methods if needed */

/* @author Zachary Wartell && ...
 * Constructor new UnitSquare Object
 * 
 * Student Note: This is a simple example designed as a template for how to build other
 * Shape sub-classes (such as UnitDisc).
 * 
 * @param {Object} gl - a WebGLContext object
*/
var UnitSquare = function(gl,shader)
{
    Shape.call(this); // call parent class constructor
    
    this.renderable = new SimpleRenderable (shader);//new Shader(gl, "vertex-shader", "fragment-shader"));
    this.renderable.vertices.push([-0.5,-0.5]);
    this.renderable.vertices.push([ 0.5,-0.5]);
    this.renderable.vertices.push([ 0.5, 0.5]);
    this.renderable.vertices.push([-0.5,-0.5]);
    this.renderable.vertices.push([-0.5, 0.5]);
    this.renderable.vertices.push([ 0.5, 0.5]); 
    this.renderable.updateBuffers();    
    this.renderable.color.set([1.0,1.0,1.0,1.0]); 
};
UnitSquare.prototype = Object.create(Shape.prototype);//UnitSquare inherits from Shape

/* @author Zachary Wartell 
 * Render this UnitSquare.
 * @returns {undefined}
 */
UnitSquare.prototype.render = function ()
{
    this.renderable.render();   // calling base class render function is sufficient for UnitSquare objects
};

/* @author Zachary Wartell 
 * Return whether the point 'point_wcs' given in World Coordinates is inside
 * the boundaries of this Shape.
 * 
 * @param {Vec2} point_wcs
 * @returns {Boolean}
 */
UnitSquare.prototype.point_inside = function (point_wcs)
{
    // compute point coordinate in coordinate system of .parent
    var point_lcs = new Vec3();
    point_lcs.x = point_wcs.x; point_lcs.y = point_wcs.y;  point_lcs.w = 1.0;
    if (this.parent !== null)
        point_lcs.multiply(this.parent.local_from_world());
    
    // perform containment test (in local coordinate space)
    //console.log("  lcs: " + point_lcs.x + ", " + point_lcs.y);
    return point_lcs.x <= 0.5 && point_lcs.x >= -0.5 &&
           point_lcs.y <= 0.5 && point_lcs.y >= -0.5;
};

// \todo Student Note:  create a UnitDisc class that renders a Disc instead of Square.  Study the UnitSquare code, copy it and modify it 
// to create UnitDisc.

var UnitDisc = function (gl, shader, center, radius, numVertices, color, name){
	Shape.call(this);
	
	this.renderable = new SimpleRenderable(shader);
	this.renderable.primitive = gl.TRIANGLE_FAN;
	if(!(center instanceof Vec2))
		this.center = new Vec2([0.0,0.0]);
	else
		this.center = center;
	if(radius <= 0.0 || radius >= 1.0)
		this.radius = 1.0;
	else
		this.radius = radius
	if(numVertices <= 0)
		this.numVertices = 25;
	else
		this.numVertices = numVertices
	if(!(color instanceof Array))
		this.color = [1.0,1.0,1.0,1.0];
	else
		this.color = color;
	if(!name)
		this.name = "Unnamed";
	else
		this.name = name;
	this.selectable = true;
	
	this.renderable.vertices.push([0.0, 0.0]);
	
	for(var i = 0; i <= this.numVertices; i++){
		var a = (360/this.numVertices) * (i/180 * Math.PI);
		this.renderable.vertices.push([this.center.x + this.radius * Math.sin(a), this.center.y + this.radius * Math.cos(a)]);
	}
	
	this.renderable.updateBuffers();
	this.renderable.color.set(this.color);
};

UnitDisc.prototype = Object.create(Shape.prototype);

UnitDisc.prototype.render = function (){
	this.renderable.render();
};

UnitDisc.prototype.point_inside = function(point_wcs){
	
	//Get point in local system from world system
	var point_lcs = new Vec3();
	point_lcs.x = point_wcs.x;
	point_lcs.y = point_wcs.y;
	point_lcs.w = 1.0;
	
	if(this.parent !== null){
		point_lcs.multiply(this.parent.local_from_world());
	}
	
	return (Math.pow(point_lcs.x - this.center.x, 2) + Math.pow(point_lcs.y - this.center.y, 2) <= Math.pow(this.radius, 2));
};


