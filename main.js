let gl;
let program;
let playAnimation = false;

let eye = vec3(0, 0, 1.5);
let at = vec3(0.0, 0.0, 0.0);
let up = vec3(0.0, 1.0, 0.0);

let cameraMatrix;
let modelViewMatrix, projMatrix;
let modelViewMatrixLoc, projMatrixLoc;

// sphere vars and fns
let index = 0;
let numTimesToSubdivide = 0;

let pointsArray = [];
let normalsArray = [];

let v1 = vec4( -0.5, -0.5,  0.5, 1.0 );
let v2 = vec4( -0.5,  0.5,  0.5, 1.0 );
let v3 = vec4(  0.5,  0.5,  0.5, 1.0 );
let v4 = vec4(  0.5, -0.5,  0.5, 1.0 );
let v5 = vec4( -0.5, -0.5, -0.5, 1.0 );
let v6 = vec4( -0.5,  0.5, -0.5, 1.0 );
let v7 = vec4(  0.5,  0.5, -0.5, 1.0 );
let v8 = vec4(  0.5, -0.5, -0.5, 1.0 );

let lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
let lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
let lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0);
let lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0);

let materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
let materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
let materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
let materialShininess = 20.0;

let translationMatrix = translate(-6, -1, 0);
let rotationMatrix = rotateY(0);
let scalingMatrix = scalem(0.1, 0.1, 0.1);

function triangle(a, b, c) {

    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);

    // normals are vectors

    normalsArray.push(a[0],a[1], a[2], 0.0);
    normalsArray.push(b[0],b[1], b[2], 0.0);
    normalsArray.push(c[0],c[1], c[2], 0.0);

    index += 3;

}

function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {

        let ab = mix( a, b, 0.5);
        let ac = mix( a, c, 0.5);
        let bc = mix( b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
    }
    else {
        triangle( a, b, c );
    }
}

function cube(a, b, c, d, e, f, g, h, n) {
    divideTriangle(a, b, d, n);
    divideTriangle(b, c, d, n);

    divideTriangle(b, f, g, n);
    divideTriangle(b, c, g, n);

    divideTriangle(c, d, g, n);
    divideTriangle(d, g, h, n);

    divideTriangle(e, f, h, n);
    divideTriangle(f, g, h, n);

    divideTriangle(a, b, f, n);
    divideTriangle(a, e, f, n);

    divideTriangle(a, e, h, n);
    divideTriangle(a, d, h, n);
}
// end of sphere vars

// line vars and fns
let lineControlPoints = [

    vec4(-0.60, -0.10, 0.0, 1.0),
    vec4(0.1, -0.10, 0.0, 1.0),
    vec4(0.75, -0.5, 0.0, 1.0),
    vec4(0.35, 0.5, 0.0, 1.0),
    vec4(0.1, 0.4, 0.0, 1.0),
    vec4(-0.75, 0.75, 0.0, 1.0),
    vec4(-0.60, -0.10, 0.0, 1.0),
    vec4(0.1, -0.10, 0.0, 1.0),

];

function chaikin(vertices, iterations) {


    if (iterations === 0) {
        return vertices;
    }

    let newVertices = [];

    for(let i = 0; i < vertices.length - 1; i++) {
        let v0 = vertices[i];
        let v1 = vertices[i + 1];

        let p0 = mix(v0, v1, 0.25);
        let p1 = mix(v0, v1, 0.75);

        newVertices.push(p0, p1);
    }

    return chaikin(newVertices, iterations - 1);
}

let lineSubdivisions = 0;
let linePoints = [];
// end of line vars and fns

function main()
{
    // Retrieve <canvas> element
    let canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = WebGLUtils.setupWebGL(canvas, undefined);

    //Check that the return value is not null.
    if (!gl)
    {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    program = initShaders(gl, "vshader", "fshader");
    gl.useProgram(program);

    //Set up the viewport
    gl.viewport( 0, 0, 400, 400);

    gl.enable(gl.DEPTH_TEST);

    let diffuseProduct = mult(lightDiffuse, materialDiffuse);
    let specularProduct = mult(lightSpecular, materialSpecular);
    let ambientProduct = mult(lightAmbient, materialAmbient);

    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

    projMatrix = perspective (60, 1.0, 0.10, 100.0);
    projMatrixLoc = gl.getUniformLocation(program, 'projMatrix');
    gl.uniformMatrix4fv(projMatrixLoc, false, flatten(projMatrix));

    cameraMatrix = lookAt(eye, at , up);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    translationMatrix = translate(-6, -1, 0);
    rotationMatrix = rotateY(0);
    scalingMatrix = scalem(0.1, 0.1, 0.1);

    modelViewMatrix = mult(cameraMatrix , mult(scalingMatrix, mult(translationMatrix, rotationMatrix)));

    render(2);

    window.onkeypress = function(event) {
        let key = event.key;
        switch(key.toLowerCase()) {
            case 'q':
                if(numTimesToSubdivide >= 0 && numTimesToSubdivide < 5){
                    numTimesToSubdivide++;
                    console.log('increase line numTimesToSubdivide to ' + numTimesToSubdivide);
                    render(1);
                }
                break;
            case 'e':
                if(numTimesToSubdivide > 0 && numTimesToSubdivide <= 5) {
                    numTimesToSubdivide--;
                    console.log('decrease line numTimesToSubdivide to ' + numTimesToSubdivide);
                    render(1);
                }
                break;
            case 'i':
                if(lineSubdivisions >= 0 && lineSubdivisions < 8){
                    lineSubdivisions++;
                    console.log('increase line subdivisions to ' + lineSubdivisions);
                    render(0);
                }
                break;
            case 'j':
                if(lineSubdivisions > 0 && lineSubdivisions <= 8) {
                    lineSubdivisions--;
                    console.log('decrease line subdivisions to ' + lineSubdivisions);
                    render(0);
                }
                break;
            case 'a':
                if(playAnimation){
                    playAnimation = false;
                    console.log("playingAnimation =" + playAnimation);
                }else if (!playAnimation){
                    playAnimation = true;
                    render(3);
                    console.log("playingAnimation =" + playAnimation);
                }
        }
    }

}

let currentPosition = 0;
let nextPosition = 1;
let steps = 0;
let speed = 0;
let oldPointsLength = 1;

function render(action){

    switch (lineSubdivisions){
        case 0:
            speed = 100;
            break;
        case 1:
            speed = 50;
            break;
        case 2:
            speed = 25;
            break;
        case 3:
            speed = 10;
            break;
        case 4:
            speed = 5;
            break;
        case 5:
            speed = 2;
            break;
        default:
            speed = 1;
            break;
    }

    // console.log('old points length' + linePoints.length);
    oldPointsLength = linePoints.length;

    pointsArray = [];
    normalsArray = [];
    linePoints = [];

    cube(v1, v2, v3, v4, v5, v6, v7, v8, numTimesToSubdivide);
    linePoints = chaikin(lineControlPoints, lineSubdivisions);

    let ratioOld = currentPosition/(oldPointsLength - 1);

    if(action === 0){
        console.log('old current' + currentPosition);
        currentPosition = Math.round((linePoints.length - 1) * ratioOld);
        nextPosition = currentPosition + 1;
        console.log('new current' + currentPosition);

        translationMatrix = translate(linePoints[currentPosition][0]*10, linePoints[currentPosition][1]*10, 0);
        modelViewMatrix = mult(cameraMatrix , mult(scalingMatrix, mult(translationMatrix, rotationMatrix)));
    }

    // console.log(currentPos);
    // gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // render sphere

    renderHelper(pointsArray, normalsArray, modelViewMatrix, false);
    renderHelper(linePoints, linePoints, cameraMatrix, true);
    // render path

    if(playAnimation && action != 1 && action != 0){

        let directionVec = subtract(linePoints[nextPosition], linePoints[currentPosition]);

        let ratio = directionVec[0]/directionVec[1];

        console.log(ratio);

        if(steps < speed){
            translationMatrix = translate(directionVec[0]/speed, directionVec[1]/speed, 0);
            // translationMatrix = translate(ratio * directionVec[0], ratio * directionVec[1], 0);

            modelViewMatrix = mult(translationMatrix , modelViewMatrix);

            steps++;
        }else{
            steps = 0;
            console.log('currentPosition ' + currentPosition);
            console.log('nextPosition ' + nextPosition);
            console.log('points length ' + linePoints.length);

            if(currentPosition < linePoints.length) {
                currentPosition++;
                nextPosition++;
            }

            if(nextPosition === linePoints.length - 1){
                console.log('loop done');
                currentPosition = 0;
                nextPosition = 1;
            }

        }

        requestAnimationFrame(render);
    }

}

function renderHelper(points, normal, model, isCurve){

    // Set clear color

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    let vNormal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vNormal);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normal), gl.STATIC_DRAW);

    let vNormalPosition = gl.getAttribLocation( program, "vNormal");
    gl.vertexAttribPointer(vNormalPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormalPosition);

    modelViewMatrixLoc = gl.getUniformLocation(program, 'modelViewMatrix');
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(model));

    let boolLoc = gl.getUniformLocation(program, "isCurve");
    gl.uniform1i(boolLoc, isCurve);

    if(!isCurve){
        gl.drawArrays(gl.TRIANGLES, 0, points.length);
    }else{
        console.log(points.length);
        gl.drawArrays(gl.LINE_LOOP, 0, points.length);
    }



}

