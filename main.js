
// Control vertices for line
let lineControlPoints = [
    vec4(0.0, 0.4, 0.0, 1.0),
    vec4(-0.75, 0.75, 0.0, 1.0),
    vec4(-0.60, -0.10, 0.0, 1.0),
    vec4(0.0, -0.10, 0.0, 1.0),
    vec4(0.75, -0.5, 0.0, 1.0),
    vec4(0.35, 0.5, 0.0, 1.0),

];

let lineSubdivisions = 8;

let eye = vec3(0, 0, 1.5);
let at = vec3(0.0, 0.0, 0.0);
let up = vec3(0.0, 1.0, 0.0);

let newPoints = [];

function chaikin(vertices, iterations) {

    if (iterations === 0) {
        return vertices;
    }

    var newVertices = [];

    for(var i = 0; i < vertices.length - 1; i++) {
        var v0 = vertices[i];
        var v1 = vertices[i + 1];

        var p0 = mix(v0, v1, 0.25);
        var p1 = mix(v0, v1, 0.75);

        newVertices.push(p0, p1);
    }
    return chaikin(newVertices, iterations - 1);
}

function main()
{
    // Retrieve <canvas> element
    let canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    let gl = WebGLUtils.setupWebGL(canvas, undefined);

    //Check that the return value is not null.
    if (!gl)
    {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    let program = initShaders(gl, "vshader", "fshader");
    gl.useProgram(program);

    //Set up the viewport
    gl.viewport( 0, 0, 400, 400);

    gl.enable(gl.DEPTH_TEST);

    // Set clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear canvas by clearing the color buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let linePoints = chaikin(lineControlPoints, lineSubdivisions);

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(linePoints), gl.STATIC_DRAW);

    let projMatrix = perspective(60, 1.0, 0.1, 100.0);
    let projMatrixLoc = gl.getUniformLocation(program, 'projMatrix');
    gl.uniformMatrix4fv(projMatrixLoc, false, flatten(projMatrix));

    let modelViewMatrix = lookAt(eye, at , up);
    let modelViewMatrixLoc = gl.getUniformLocation(program, 'modelViewMatrix');
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));


    let vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.drawArrays(gl.LINE_LOOP, 0, linePoints.length);
}

