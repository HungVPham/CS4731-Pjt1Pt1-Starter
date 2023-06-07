let gl;
let program;
let points;
let colors;

let xmlDoc;
let parser = new DOMParser();

let scaleFactor = 1;

let canvas;

let theta = 0;
let splitDims = [];

let ctMatrix;

let oldX;
let oldY;
let newX;
let newY;

let isDragging = false;

let imageCenter = [];

function main()
{
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

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

    const inputElement = document.getElementById("files");

    inputElement.addEventListener("change", (e) => {
        handleFiles(e)
    });

    function handleFiles(evt){

        let reader = readTextFile(evt);

        let defaultDims = [0, 0, 1, 1]; // default dims --> viewbox format

        let defaultColor = {r: 0, g: 0, b: 0}; // default color is black

        points = [];
        colors = [];
        let projMatrix;

        reader.onload = function (){

            xmlDoc = parser.parseFromString(reader.result.toString(),"image/svg+xml");

            let linesAndColors = xmlGetLines(xmlDoc, defaultColor);
            splitDims = xmlGetViewbox(xmlDoc, defaultDims);

            for (let i = 0; i < linesAndColors[0].length; i++) {
                points.push(vec4(linesAndColors[0][i][0], linesAndColors[0][i][1], 0.0, 1.0));
            }

            for (let i = 0; i < linesAndColors[1].length; i++) {
                colors.push(vec4(linesAndColors[1][i][0], linesAndColors[1][i][1], linesAndColors[1][i][2], linesAndColors[1][i][3]));
            }

            //splitDims from xmlGetViewbox
            if(splitDims[2] > splitDims[3]){ // if viewbox width > viewbox height
                gl.viewport( 0, 0, canvas.width, canvas.height * (splitDims[3]/splitDims[2]));
            }else if(splitDims[3] > splitDims[2]){ // if viewbox height > viewbox width
                gl.viewport( 0, 0, canvas.width * (splitDims[2]/splitDims[3]), canvas.height);
            }else {
                gl.viewport( 0, 0, canvas.width , canvas.height);
            }

            projMatrix = ortho(splitDims[0],
                splitDims[0] + splitDims[2],
                splitDims[3] + splitDims[1],
                splitDims[1], -1, 1);


            let projMatrixLoc = gl.getUniformLocation(program, "projMatrix");
            // //
            gl.uniformMatrix4fv(projMatrixLoc, false, flatten(projMatrix));
            // console.log(reader.result);
            //
            let vBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.DYNAMIC_DRAW);

            let vPosition = gl.getAttribLocation(program, "vPosition");
            gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vPosition);

            let cBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.DYNAMIC_DRAW);

            let vColor = gl.getAttribLocation(program, "vColor");
            gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(vColor);

            imageCenter = [(splitDims[2] + 2*splitDims[0])/2, (splitDims[3] + 2*splitDims[1])/2];

            reset();

        }

    }

    canvas.onmousedown = function(event){
        mouseDown(event);
    };

    window.onmouseup = function(event){
        mouseUp(event);
    };

    canvas.onmousemove = function(event){
        mouseMove(event);
    };

    window.onkeypress = function(event) {
        var key = event.key;
        switch(key) {
            case 'r':
                reset();
        }
    }

    canvas.onwheel = function (event){
        if (event.deltaY < 0)
        {
            if (event.shiftKey){

                if(scaleFactor < 1 && scaleFactor >= 0.1){
                    scaleFactor+=0.1;
                }else if(scaleFactor >= 1 && scaleFactor < 10){
                    scaleFactor+=1;
                }

                scaleFactor = Math.round(scaleFactor * 10) / 10

                render();

                console.log(scaleFactor);
            }else if(theta >= -360 && theta < 360){
                theta += 5
                console.log('rotate theta is ' + theta);

                render();
            }
        }
        else if (event.deltaY > 0)
        {
            if (event.shiftKey){

                if(scaleFactor <= 1 && scaleFactor > 0.1){
                    scaleFactor-=0.1;
                }else if(scaleFactor > 1 && scaleFactor <= 10){
                    scaleFactor-=1;
                }

                scaleFactor = Math.round(scaleFactor * 10) / 10

                render();

                console.log(scaleFactor);
            }else if(theta > -360 && theta <= 360){
                theta -= 5
                console.log('rotate theta is ' + theta);

                render();
            }
        }
    }
}

function mouseDown(event){
    isDragging = true;

    // console.log(event.offsetX);
    // console.log(event.offsetY);

}

function mouseUp(event){
    isDragging = false;
}

function mouseMove(event){

    if(isDragging){
        oldX = newX;
        oldY = newY;

        console.log('oldX = ' + oldX);
        console.log('oldY = ' + oldY);

        convert(event.offsetX, event.offsetY, event.movementX, event.movementY);
        render();
    }
}

function render(){

    // 1. Translate to the origin
    let translateMatrix = translate(splitDims[2]/2 + splitDims[0], splitDims[3]/2 + splitDims[1], 0);

    // 2. Scale z by an amount
    let scaleMatrix = scalem(scaleFactor, scaleFactor, scaleFactor);
    ctMatrix = mult(translateMatrix, scaleMatrix);

    // 3. rotate z by theta
    let rotateMatrix = rotate(theta, [0, 0, 1]);
    ctMatrix = mult(ctMatrix, rotateMatrix);

    // 4. translate back
    let newTranslation = translate(oldX + newX, oldY + newY, 0);
    ctMatrix = mult(newTranslation, mult(ctMatrix, inverse(translateMatrix)));

    let ctMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
    gl.uniformMatrix4fv(ctMatrixLoc, false, flatten(ctMatrix));

    gl.clear(gl.COLOR_BUFFER_BIT);
    // Draw lines connecting the points
    gl.drawArrays(gl.LINES, 0, points.length);
}

function convert(offsetX, offsetY, movementX, movementY){

    newX = convertToWorldX(offsetX) - convertToWorldX(offsetX - movementX);
    newY = convertToWorldY(offsetY) - convertToWorldY(offsetY - movementY);

    // console.log('offsetX = ' + offsetX);
    // console.log('offsetY = ' + offsetY);
    //
    // console.log('movementX = ' + movementX);
    // console.log('movementY = ' + movementY);

    console.log('newX = ' + newX);
    console.log('newY = ' + newY);
}

function convertToWorldX(x0){

    let xf;
    let ratio;

    if(splitDims[2] >= splitDims[3]){
        ratio = splitDims[2]/canvas.width;
    }else{
        ratio = splitDims[3]/canvas.height;
    }

    xf = ratio*x0 + (imageCenter[0] - splitDims[2]/2);

    return xf;
}

function convertToWorldY(y0){

    let yf;
    let ratio;

    if(splitDims[2] >= splitDims[3]){
        ratio = splitDims[2]/canvas.width;
    }else{
        ratio = splitDims[3]/canvas.height;
    }

    yf = ratio*y0 + (imageCenter[1] + splitDims[3]/2);
    // yf = (splitDims[3]/canvas.height)*y0 + (splitDims[3] + splitDims[1]);

    return yf;
}

function reset(){

    scaleFactor = 1;
    theta = 0;
    newX = 0;
    newY = 0;
    oldX = 0;
    oldY = 0;

    render();
}
