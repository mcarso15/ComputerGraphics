/**
 * @author Zachary Wartell, ...
 * 
 * math2D.js is a set of 2D geometry related math functions and classes.
 * 
 * Students are given a initial set of classes and functions are expected to extend these and add
 * additional functions to this file.
 * 
 */

/**
 * Constructor of Mat2, a 2x2 matrix 
 * 
 * For efficiency we use a Typed Array.  Elements are stored in 'column major' layout, i.e.
 * for matrix M with math convention M_rc
 *    this.array = [ M_00, M_10,    // first column
 *                   M_01, M_11 ];  // second column
 *                   
 *                   
 * column major order is consistent with OpenGL and GLSL
 *                   
 * @param {null}                  
 * @returns {Mat2}
 */
var Mat2 = function()
{
    this.array = new Float32Array(4);
    this.array.set([1.0, 0.0, 
                    0.0, 1.0]);
};

/**
 * 'get' returns element in column c, row r of this Mat2
 * @param {Number} c - column
 * @param {Number} r - row
 * @returns {Number}
 */
Mat2.prototype.get = function (c, r)
{
    return this.array[c*2+r];
};

/**
 * 'set' sets element at column c, row r to value 'val'.
 * @param {Number} c - column
 * @param {Number} r - row
 * @param {Number} val - value
 * @returns {Number}
 */
Mat2.prototype.set = function (c, r, val)
{
    this.array[c*2+r] = val;
};

/**
 * 'det' return the determinant of this Mat2
 * @returns {Number}
 */
Mat2.prototype.det = function ()
{
    return this.array[0] * this.array[3] - this.array[1] * this.array[2];
};

/**
 * Constructor of Vec2. Vec2 is is used to represent coordinates of geometric points or vectors. 
 * 
 * @param {null | Vec2 | [Number, Number]}
 */
var Vec2 = function ()
{
    if (arguments.length === 0)
    {// no arguements, so initial to 0's
        this.array = new Float32Array(2);
        this.array.set([0.0, 0.0]);
    }
    else if (arguments.length === 1)
    {// 1 argument, ...
        if (arguments[0] instanceof Vec2)
        {// argument is Vec2, so copy it
            this.array = new Float32Array(arguments[0].array);
        }
        else if (arguments[0] instanceof Array)
        {// argument is Array, so copy it
            this.array = new Float32Array(arguments[0]);
        }
    }
};

/**
 *  Vec2 - provide alternate syntax for setting/getting x and y coordinates (see math2d_test for examples).
 */
var v = Vec2.prototype;
Object.defineProperties(Vec2.prototype,
        {
            "x": {get: function () {
                    return this.array[0];
                },
                set: function (v) {
                    this.array[0] = v;
                }},
            "y": {get: function () {
                    return this.array[1];
                },
                set: function (v) {
                    this.array[1] = v;
                }}
        }
);


/**
 * Add Vec2 'v' to this Vec2
 * @param {Vec2} v    
 */
Vec2.prototype.add = function (v)
{
    this.array.set([this.array[0] + v.array[0], this.array[1] + v.array[1]]);
};

/**
 * Subtract Vec2 'v' from this Vec2
 * @param {Vec2} v    
 */
Vec2.prototype.sub = function (v)
{
	this.array.set([this.array[0] - v.array[0], this.array[1] - v.array[1]]);	
};

/**
 * Treat this Vec2 as a column matrix and multiply it by Mat2 'm' to it's left, i.e.
 * 
 * v = m * v
 * 
 * @param {Mat2} m    
 */
Vec2.prototype.multiply = function (m)
{
     this.array.set([this.array[0]*m.array[0] + this.array[1]*m.array[2],
                     this.array[0]*m.array[1] + this.array[1]*m.array[3] ]);
};

/**
 * Treat this Vec2 as a row matrix and multiply it by Mat2 'm' to it's right, i.e.
 * 
 * v = v * m
 * 
 * @param {Mat2} m
 */
Vec2.prototype.rightMultiply = function (m)
{
     this.array.set([this.array[0]*m.array[0] + this.array[1]*m.array[1],
                     this.array[0]*m.array[2] + this.array[1]*m.array[3] ]);
};

/**
 * Return the dot product of this Vec2 with Vec2 'v'
 * @param {Vec2} v    
 * @return {Number}
 */
Vec2.prototype.dot = function (v)
{
    var dotP = this.array[0] * v.array[0] + this.array[1] * v.array[1];
    return dotP;
};

/**
 * Return the magnitude (i.e. length) of of this Vec2 
 * @return {Number}
 */
Vec2.prototype.mag = function ()
{
	var tmp = this.array[0] * this.array[0] + this.array[1] * this.array[1];
    return Math.sqrt(tmp);
};

/**
 * Compute the barycentric coordinate of point 'p' with respect to barycentric coordinate system
 * defined by points p0,p1,p2.
 * 
 * @param {Vec2} p0 - first point of barycentric coordinate system
 * @param {Vec2} p1 - second point of barycentric coordinate system
 * @param {Vec2} p2 - third point of barycentric coordinate system
 * @param {Vec2} p  - point to compute the barycentric coordinate of
 * @returns {[Number, Number, Number]} - array with barycentric coordinates of 'p'
 */
function barycentric (p0, p1, p2, p)
{
	var vp0 = new Vec2(p0);
	var vp1 = new Vec2(p1);
	var vp2 = new Vec2(p2);
	var vp  = new Vec2(p);
	
	vp1.sub(vp0);
	vp2.sub(vp0);
	vp.sub(vp0);
	
	var m00 = vp1.dot(vp1);
	var m01 = vp1.dot(vp2);
	var m11 = vp2.dot(vp2);
	var m20 = vp.dot(vp1);
	var m21 = vp.dot(vp2);
	
	var denominator = (m00 * m11) - (m01 * m01);
	var v = ((m11 * m20) - (m01 * m21))/denominator;
	var w = ((m00 * m21) - (m01 * m20))/denominator;
	var u = 1 - v - w;
	
	return [u,v,w];
}

/**
 * Compute distance between point 'p' and the line through points 'p0' and 'p1'
 * @param {Vec2} p0 - first point on line
 * @param {Vec2} p1 - second point on line
 * @param {Vec2} p  - point for which we are computing distance
 * @returns distance from point p to the line defined by p0 and p1
 */
function pointLineDist(p0, p1, p)
{
	
	var A = new Vec2(p0);
	var B = new Vec2(p1);
	var P = new Vec2(p);
	
	var num = new Mat2([B.sub(A), A.sub(P)]);
	var result = -1;
	
	var len = Math.abs(B.mag() - A.mag());
	
	if(len != 0){
		result = num.det()/len;
	}
	
	
	if (result < 0){
		x = p0[0];
		y = p0[1];
	}
	
	else if (result > 1){
		x = p1[0];
		y = p1[1];
	}
	
	else {
		x = p0[0] + result*(B.array[0] - A.array[0]);
		y = p0[1] + result*(B.array[1] - A.array[1]);
	}
	
	var dx = p[0] - x;
	var dy = p[1] - y;
	
	var distance = Math.sqrt((dx*dx) + (dy * dy));		
	
	return distance;
}

/**
 * This contains misc. code for testing the functions in this file.
 * 
 * Students can optionally use this function for testing their code...
 * @returns {undefined}
 */
function math2d_test()
{
    var M1 = new Mat2();
    var v0 = new Vec2(), v1 = new Vec2([5.0,5.0]), v2, 
            vx = new Vec2([1.0,0.0]),
            vy = new Vec2([0.0,1.0]);
    
    var rad = 45 * Math.PI/180;
    M1.set(0,0, Math.cos(rad)); M1.set(1,0, -Math.sin(rad)); 
    M1.set(0,1, Math.sin(rad)); M1.set(1,1, Math.cos(rad));
    
       
    v0.x = 1.0;
    v0.y = 2.0;
    v0.y += 1.0;
    v2 = new Vec2(v0);
    v2.add(v1);
    
    vx.multiply(M1);       
    vy.multiply(M1);       
    
    console.log (JSON.stringify(M1));
    console.log (JSON.stringify(v2));
    console.log (v0.dot(v1));
    console.log (v0.mag());
}

