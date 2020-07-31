var container, controls;
var camera, scene, renderer;

// so defenetly it needs to do configurator right here 
var pmremGenerator, envMap, backgroundColor;  // clinic environement - global variables
//var bones, absorbers, cord;
var  absorbers, cord , bones;
// sprites for coloredspine
var c_sprite, t_sprite, l_sprite, s_sprite, k_sprite;
//
container = document.createElement( 'div' );
document.body.appendChild( container );
//

camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.25, 300 );
//camera.position.set( - 30, 20, 20 );  // common view
 camera.position.set( 0, 0, 40 ); //use for sprites only
scene = new THREE.Scene();

// background color in HEX
var backgroundBlue = new THREE.Color(0x485770); //Global variable for Blue background
var backgroundBlack = new THREE.Color(0x000000); //Global variable for Black background




init();
render();

function init() {

	renderer = new THREE.WebGLRenderer( { antialias: true , alpha : true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 0.4;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild( renderer.domElement );

    
    pmremGenerator = new THREE.PMREMGenerator( renderer );
    pmremGenerator.compileEquirectangularShader();

    loader();   // loading 3d models
    RGBELoader();  // loading hdr
    spineSprites(); // creating sprites for bones
    spriteVisible(false); // hiding sprites


	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.addEventListener( 'change', render ); // using cos there is no animation loop
	controls.minDistance = 0.01;
	controls.maxDistance = 100;
    controls.target.set( 0, 0, 0 );
    controls.screenSpacePanning = true;
    controls.update();
    
	window.addEventListener( 'resize', onWindowResize, false );

}

// resizing scene if window has been resized
function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
	render();

}

// simply render function
function render() {

	renderer.render( scene, camera );
}
// loading clinic HDR texture, but dont set up scene background
function RGBELoader() {
    new THREE.RGBELoader().setDataType( THREE.UnsignedByteType ).setPath( 'textures/' ).load( 'clinic.hdr',
    function ( texture ) {
                    envMap = pmremGenerator.fromEquirectangular( texture ).texture;
                    scene.environment = envMap;
                    scene.background = backgroundBlack;                  
                    render();	
    } );  
}

// Loading bones , absorbers and cord as 3 separate objects
// it could be merged all in one , but file will weight as  amount of 3 files, and code  not readable
function loader() {

    var loader = new THREE.GLTFLoader().setPath( 'models/' );

    loader.load( 'bones.glb', function ( glb ) {
        glb.scene.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
            }
        } );

      bones = glb.scene;                       
      bones.scale.set( 0.06, 0.06, 0.06 );
      bones.position.y = -18;
      scene.add ( bones );

      // making clone for colored spine  
      coloredSpine = bones.clone();
      coloredSpine.visible = false;
      scene.add ( coloredSpine );
      createColoredSpine(); // painting spine 
      render();

    } );
    
    // Downloading absorbers

     loader.load( 'absorbers.glb', function ( glb ) {
         
             glb.scene.traverse( function ( child ) {
                 if ( child.isMesh ) {
                    child.castShadow = true;
                 }
             } );
             absorbers = glb.scene;                           
             absorbers.scale.set( 0.06, 0.06, 0.06 );
             absorbers.position.y = -18;
             scene.add( absorbers );
             render();
    } );
    

    // Downloading human cord
    loader.load( 'cord.glb', function ( glb ) {
         
        glb.scene.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
            }
        } );
        cord = glb.scene;                           
        cord.scale.set (0.06, 0.06, 0.06);
        cord.position.y = -18;
        scene.add( cord );
        render();	
    } );
    
}

//logic for range
function range() {

    var range = document.getElementById('range');
   // moving step
    var sliding = range.value / 15;

// centred bones, absorbers and cord
    if (range.value > 40 && range.value < 60) {

        coloredSpine.visible = false; 
        bones.visible        = true;
        absorbers.visible    = true; 
        cord.visible         = true;
        spriteVisible(false);

        // moving part
        moveToZero();

    }

    if (range.value < 40 && range.value > 25) {

        coloredSpine.visible = false;
        absorbers.visible    = false;
        cord.visible         = true;
        bones.visible        = true;
        spriteVisible(false);
         
        // moving part
        moveToZero();
    }
 
    if (range.value > 15 && range.value <= 25 ){

        cord.visible         = true;
        absorbers.visible    = false;
        coloredSpine.visible = false;
        bones.visible        = false;
        spriteVisible(false);

       // moving part
        moveToZero();
        
    }

    if (range.value <= 15) {

        bones.visible     = false;
        cord.visible      = false;
        absorbers.visible = false;
        coloredSpine.visible = true;

        spriteVisible(true); 

    }

    if (range.value > 60 ) {

        spriteVisible(false); 
        bones.visible        = true;
        absorbers.visible    = true; 
        cord.visible         = true;
        coloredSpine.visible = false;
        // moving part
        bones.position.x     = range.value / 8 - sliding;
        absorbers.position.x = range.value / 18 - sliding;
        cord.position.x      = - sliding;
    }

    render();
}

function moveToZero(){

    bones.position.x     = 0;
    absorbers.position.x = 0;
    cord.position.x      = 0;

}

//------------- making screenshot -------------------
// getting acces to canvas
const canvas = container.children[0];
const elem = document.querySelector('#screenshot');
  elem.addEventListener('click', () => {
    render();
    canvas.toBlob((blob) => {
      saveBlob(blob, `screencapture-${canvas.width}x${canvas.height}.png`);
    });
  });

  const saveBlob = (function() {
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    return function saveData(blob, fileName) {
       const url = window.URL.createObjectURL(blob);
       a.href = url;
       a.download = fileName;
       a.click();
    };
  }());

 // changing background "monocolor" - > HDR - > "monocolor" - >
  var backgroundSwitcher = 0;
  function changeBackground() {

    switch(backgroundSwitcher) {
        case 0:
            scene.background   = backgroundBlue;
            backgroundSwitcher = 1;
            break;

        case 1:
            scene.background   = envMap;
            backgroundSwitcher = 2;
            break;
        case 2:
            scene.background   = backgroundBlack;
            backgroundSwitcher = 0;
            break;
    }

    render();
  }

  function createColoredSpine()
  {
    coloredSpine.children.forEach(function(bone, index) {
           // шейный отдел
        if (index >= 0 && index <= 4) {
            bone.material = new THREE.MeshStandardMaterial({ color: 0xffc107 });
        }
           //грудной отдел
        if (index >= 5 && index <= 16) {   
            bone.material = new THREE.MeshStandardMaterial({ color: 0x0080ff });
        }
           // поясничный отдел
        if (index >= 17 && index <= 23) {
            bone.material = new THREE.MeshStandardMaterial({ color: 0xcd0000 });
        }
           // крестцовый отдел
        if (index == 25) {
            bone.material = new THREE.MeshStandardMaterial({ color: 0x32cd32 });
        }  // копчик
        if (index == 24) {
            bone.material = new THREE.MeshStandardMaterial({ color: 0xe01bbf });
        }  
    });
  }

//-------------------BEGIN SPRITE BLOCK--------------------------------------
//---------------------------------------------------------------------------
// managing visible otions for sprites

 function spineSprites(){
    c_sprite = makeTextSprite( " Шейный отдел ", 
    { fontsize: 20, borderColor: {r:255, g:255, b:255, a:0.0}, backgroundColor: {r:0, g:0, b:0, a:0} } );
    c_sprite.scale.set(15, 11, 0);
    c_sprite.position.set(10,7,1);
    scene.add( c_sprite );
    //----------------------------------------
    t_sprite = makeTextSprite( " Грудной отдел ", 
    { fontsize: 20, borderColor: {r:0, g:0, b:0, a:0.0}, backgroundColor: {r:100, g:100, b:100, a:0} } );
    t_sprite.scale.set(15, 11, 0);
    t_sprite.position.set(10,-2,1);
    scene.add( t_sprite );
    //--------------------------------------------------
    l_sprite = makeTextSprite( " Поясничный отдел ", 
    { fontsize: 20, borderColor: {r:0, g:0, b:0, a:0.0}, backgroundColor: {r:100, g:100, b:100, a:0} } );
    l_sprite.scale.set(15, 11, 0);
    l_sprite.position.set(10,-14,1);
    scene.add( l_sprite );

    //--------------------------------------------------
    s_sprite = makeTextSprite( " Крестцовый отдел ", 
    { fontsize: 20, borderColor: {r:0, g:0, b:0, a:0.0}, backgroundColor: {r:100, g:100, b:100, a:0} } );
    s_sprite.scale.set(15, 11, 0);
    s_sprite.position.set(10,-18,1);
    scene.add( s_sprite );
    //--------------------------------------------------
    k_sprite = makeTextSprite( " Копчик ", 
    { fontsize: 20, borderColor: {r:0, g:0, b:0, a:0.0}, backgroundColor: {r:100, g:100, b:100, a:0} } );
    k_sprite.scale.set(15, 11, 0);
    k_sprite.position.set(10,-21,1);
    scene.add( k_sprite );
    //--------------------------------------------------
    
 }  


function makeTextSprite( message, parameters )
{
	if ( parameters === undefined ) parameters = {};
	
	var fontface = parameters.hasOwnProperty("fontface") ? 
		parameters["fontface"] : "Arial";
	
	var fontsize = parameters.hasOwnProperty("fontsize") ? 
		parameters["fontsize"] : 18;
	
	var borderThickness = parameters.hasOwnProperty("borderThickness") ? 
		parameters["borderThickness"] : 2;
	
	var borderColor = parameters.hasOwnProperty("borderColor") ?
		parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };
	
	var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
		parameters["backgroundColor"] : { r:255, g:255, b:255, a:1.0 };

	var spriteAlignment = THREE.SpriteAlignment;
		
	var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
	context.font = "Bold " + fontsize + "px " + fontface;
    
	// get size data (height depends only on font size)
	var metrics = context.measureText( message );
	var textWidth = metrics.width;
	
	// background color
	context.fillStyle   = "rgba(" + backgroundColor.r + "," + backgroundColor.g + ","
								  + backgroundColor.b + "," + backgroundColor.a + ")";
	// border color
	context.strokeStyle = "rgba(" + borderColor.r + "," + borderColor.g + ","
								  + borderColor.b + "," + borderColor.a + ")";

	context.lineWidth = borderThickness;
	roundRect(context, borderThickness/2, borderThickness/2, textWidth + borderThickness, fontsize * 1.4 + borderThickness, 6);
	// 1.4 is extra height factor for text below baseline: g,j,p,q.
	
	// text color
	context.fillStyle = "rgba(139, 0, 0, 1.0)";

	context.fillText( message, borderThickness, fontsize + borderThickness);
	
	// canvas contents will be used for a texture
	var texture = new THREE.Texture(canvas) 
	texture.needsUpdate = true;

	var spriteMaterial = new THREE.SpriteMaterial( 
		{ map: texture } );
	var sprite = new THREE.Sprite( spriteMaterial );
	sprite.scale.set(100,50,1.0);
	return sprite;	
}

function roundRect(ctx, x, y, w, h, r) 
{
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    ctx.fill();
	ctx.stroke();   
}

function spriteVisible(boolean) {
    if (boolean == false) {
        c_sprite.visible  = false;
        t_sprite.visible  = false;
        l_sprite.visible  = false;
        s_sprite.visible  = false;
        k_sprite.visible  = false;
    } else {
        c_sprite.visible  = true;
        t_sprite.visible  = true;
        l_sprite.visible  = true;
        s_sprite.visible  = true;
        k_sprite.visible  = true;
    }
}
//---------------------------END SPRITE BLOCK--------------------------------


