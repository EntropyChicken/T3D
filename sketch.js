var ganime = ~~ (6/7/25);





/** ~~~~~~~~~~~~~ T3D Engine ~~~~~~~~~~~~~ **/

                    {

/** ~~~~~~~~~~ Pre-Definitions ~~~~~~~~~~ **/
                    
var sctpc,c,player,graphics,defaultZoom,roundTo,vLength,origin,main,levels,currentLevel,screen,complexAdjustPointForCamera,width,height,mouse,fps;
                    
/** ~~~~~~~~~~~ Program Setup ~~~~~~~~~~~ **/

// /cs/pro/5733417664643072
// var optimize = function(func){
//     return(
//         Object.constructor("__env__","return "+func.toString().replace(/.*__env__\.KAI.+t.*/g, "@").replace(/@\s*}|\n*/g, "").replace(/@+/g, ""))(this)
//     );
// }; // to cleanse the main bulk of the program

var usingWebgl = false; // somewhat faster but defeats the purpose of T3D
var webglQueue = [];
var generateAudioNodes = false; // only for khanacademy

var ianime = 0; // 0 or 101
var paused = true;

var inp = [];
for(var i = 0; i<300; i++){
    inp[i]=false;
}

// frameRate(60);
// var getFrameRate = function(){
//     return(this.__frameRate);
// };

var drawDevInfo = function(){
    push();
    scale(min(width,height)/600,min(width,height)/600);
    textSize(15);
    // textFont(createFont("Lucida Console Bold"));
    fill(0);
    var stri = "";
    
    var primitivesCount = 0;
    for(var i = 0; i<graphics.length; i++){
        primitivesCount+=graphics[i].primitives.length;
    }
    stri+=primitivesCount+" primitives in "+graphics.length+" groups";
    
    if(currentLevel>=0&&currentLevel<levels.length){
        stri+="\nPlaying \""+levels[currentLevel].name+"\"";
    }
    else{
        stri += "\nLEVEL["+currentLevel+"] NOT FOUND";
    }
    
    stri+="\nXYZ: ("+roundTo(c.x,1)+", "+roundTo(c.y,1)+", "+roundTo(c.z,1)+")";
    stri+="\nAET: ("+roundTo(c.azimuth,0)+", "+roundTo(c.elevation,0)+", "+roundTo(c.twist,0)+")";
    //stri+="\nXZ speed: "+roundTo(dist(0,0,player.xv,player.zv),3);
    //stri+="\ncanJump = "+roundTo(player.canJump,2);
    stri+="\nFPS: "+roundTo(fps,(fps<20)+(fps<2));
    textAlign(LEFT,TOP);
    text(stri,15,15);
    pop();
};

/** ~~~~~~~~~~~ Sketchy Stuff ~~~~~~~~~~~ **/
                    
Object.constructor.prototype.new=(function(){
    var obj = Object.create(this.prototype);
    this.apply(obj, arguments);
    return obj;
}); // fixes memory leak

var access = function(attribute){
    return(
        (function(){
            return(this);
        })()[attribute]
    );
};

// var localStorage = access("localStorage");

// access('document').requestPointerLock = access('document').requestPointerLock||access('document').mozRequestPointerLock; // firefox

var oPrint = function(obj,preString){
    if(preString===undefined){
        preString = "";
    }
    if(typeof(obj)==="object"){
        for(var i in obj){
            if(typeof(obj[i])==="object"){
                oPrint(obj[i],preString+i+": ");
            }
            else if(typeof(obj[i])==="string"){
                console.log(preString+i+": \""+obj[i]+"\"");
            }
            else if(typeof(obj[i])==="function"){
                console.log(preString+i+": [function]");
            }
            else{
                console.log(preString+i+": "+obj[i]);
            }
        }
    }
};
var oCopyShallow = function(obj){
    if(typeof(obj)==="object"){
        if(typeof(obj.push)==="function"){
            // obj is an array, not a typical object
            var newAr = [];
            for(var i = 0; i<obj.length; i++){
                newAr[i]=obj[i];
            }
            return(newAr);
        }
        else{
            var newObj = {};
            for(var i in obj){
                newObj[i]=obj[i];
            }
            return(newObj);
        }
    }
    return(obj);
}; // no recursion
var oCopy = function(obj){
    if(typeof(obj)==="object"){
        if(typeof(obj.push)==="function"){
            // obj is an array, not a typical object
            var newAr = [];
            for(var i = 0; i<obj.length; i++){
                newAr[i]=oCopy(obj[i]);
            }
            return(newAr);
        }
        else{
            var newObj = {};
            for(var i in obj){
                // recursive for cases with nested objects
                newObj[i]=oCopy(obj[i]);
            }
            return(newObj);
        }
    }
    // eventually reaches directly copyable data types, just return
    return(obj);
}; // proper full depth oCopy

// var lockCursor = function(){
//   paused = false;
//   canvas = document.querySelector('canvas'); // Get the canvas element
//   canvas.requestPointerLock(); // Request pointer lock when the page loads

//   // Add event listener to re-lock cursor when clicked
//   canvas.addEventListener('click', () => {
//     canvas.requestPointerLock();
//   });
// }
// var lockCursor = function(){
//     paused = false;
//     access("document").getElementById("output-canvas").requestPointerLock();
//     access("document").getElementById("output-canvas").onmousemove = function(msObj){ // <- passes in a more raw mouse input ig
//         if(!access('document').pointerLockElement){
//             if(!paused){
//                 paused = true;
//                 fill(180,100);
//                 noStroke();
//                 rect(0,0,width,height);
//             }
//             return;
//         }
//         mouse.x+=mouse.sensitivity*msObj.movementX;
//         mouse.y+=mouse.sensitivity*msObj.movementY;
//     };
// };
var handleMouseMove = function(event) {
  if (!paused) { // Only track movement when pointer is locked
    mouse.x+=mouse.sensitivity*event.movementX;
    mouse.y+=mouse.sensitivity*event.movementY;
  }
}

/** ~~~~~~~~~~~~~~~ Input ~~~~~~~~~~~~~~~ **/

mousePressed = function(){
    // the lock cursor stuff happens in the document for p5js which is kinda sus but hopefully is ok
    if(paused){
        // lockCursor();
    }
    else{
        mouse.status="clicking";
    }
};
mouseReleased = function(){
    mouse.status="releasing";
};
var mouseNature = function(){
    mouse.prevx=mouse.x;
    mouse.prevy=mouse.y;
    switch(mouse.status){
        case "idle": break;
        case "clicking":
            mouse.status = "holding";
            break;
        case "releasing":
            mouse.status = "idle";
            break;
        case "holding": break;
        default:
            console.log("Foreign Mouse Status: \""+mouse.status+"\"");
            mouse.status="idle";
            break;
    }
};

keyPressed = function(){inp[keyCode]=true;};
keyReleased = function(){inp[keyCode]=false;};
    


/** ~~~~~~~~~~~~~ T3D Engine ~~~~~~~~~~~~~ the historically khanonical section!!!!!!!!!!!!!!!!! **/



/// ~~~~~~~~~~~~~ 3D ENGINE ~~~~~~~~~~~~~ ///

/// ~~~~~~~~~~~~~ Basic Math ~~~~~~~~~~~~ ///

var dirx = [1,0,-1,0, 1,0,-1,0, 1,0,-1,0, 1,0,-1,0, 1,0,-1,0];
var diry = [0,-1,0,1, 0,-1,0,1, 0,-1,0,1, 0,-1,0,1, 0,-1,0,1]; // 2d
var dirz = [0,1,0,-1, 0,1,0,-1, 0,1,0,-1, 0,1,0,-1, 0,1,0,-1]; // 3d
var anyModulo = function(num,divisor){
    return(num-floor(num/divisor)*divisor);
    // modulo which works for negatives and non-integers
};
var anyPow = function(num,exponent){
    return(pow(num*(2*(num>0)-1),exponent)*(2*(num>0)-1));
};
roundTo = function(num,subDigits){
    return(round(num*pow(10,subDigits))/pow(10,subDigits));
};
var dist2d = function(a,b){
    return(dist(a.x,a.y,b.x,b.y));
};
var oneOf = function(){
    return(arguments[floor(random(0,arguments.length))]);
};
var incLerp = function(num1,num2,incer,lerper){
    if(abs(num1-num2)<incer){
        return(num2);
    }
    return(
        map(lerper,0,1,
            num1+incer*(2*(num2>num1)-1),
            num2
        )
    );
};
var angTo = function(base,aim,inc){
    var b = (base+72000)%360, a = (aim+72000)%360;
    if(a>180){
        if(b<a&&b>a-180){return(b+inc);}
        else{return(b-inc);}
    }
    else{
        if(b<a||b>a+180){return(b+inc);}
        else{return(b-inc);}
    }
};
var angDist = function(base,aim){
    var b = (base+72000)%360, a = (aim+72000)%360;
    if(b<a){
        return(min(abs(b-a),abs(b+360-a)));
    }
    else{
        return(min(abs(b-a),abs(b-360-a)));
    }
};
var hueLightnessToRGB = function(hue,lightness){
    hue = anyModulo(hue,1);
    var colar;
    if(hue<1/6){colar=[255,map(hue,0,1/6,0,255),0];}
    else if(hue<2/6){colar=[map(hue,1/6,2/6,255,0),255,0];}
    else if(hue<3/6){colar=[0,255,map(hue,2/6,3/6,0,255)];}
    else if(hue<4/6){colar=[0,map(hue,3/6,4/6,255,0),255];}
    else if(hue<5/6){colar=[map(hue,4/6,5/6,0,255),0,255];}
    else{colar=[255,0,map(hue,5/6,1,255,0)];}
    return [map(lightness,0,1,colar[0],255),map(lightness,0,1,colar[1],255),map(lightness,0,1,colar[2],255)];
};
                    
/// ~~~~~~~~~~~~ Vector Math ~~~~~~~~~~~~ ///
                    
var vCrossProduct = function(vec1,vec2){
    return({x:vec1.y*vec2.z-vec1.z*vec2.y,y:vec1.z*vec2.x-vec1.x*vec2.z,z:vec1.x*vec2.y-vec1.y*vec2.x});
    // input two vectors output third vector perpendicular to both
};
var vDotProduct = function(vec1,vec2){
    return(vec1.x*vec2.x+vec1.y*vec2.y+vec1.z*vec2.z);
    // like similarity
}; // keep as not normalized pls
vLength = function(vec){
    return(sqrt(vec.x*vec.x+vec.y*vec.y+vec.z*vec.z));
    //return(sqrt(abs(vDotProduct(vec,vec)))); // uh i don't think the absolute value is needed, dude
};
var velocityLength = function(thing){
    return(sqrt(thing.xv*thing.xv+thing.yv*thing.yv+thing.zv*thing.zv));
};
var velocityToVector = function(thing){
    return({
        x:thing.xv,
        y:thing.yv,
        z:thing.zv,
    });
};
var velocityToUnitVector = function(thing){
    var d = sqrt(thing.xv*thing.xv+thing.yv*thing.yv+thing.zv*thing.zv);
    return({
        x:thing.xv/d,
        y:thing.yv/d,
        z:thing.zv/d,
    });
};
var vAdd = function(vec1,vec2){
    return({x:vec1.x+vec2.x,y:vec1.y+vec2.y,z:vec1.z+vec2.z});
};
var vSub = function(vec1,vec2){
    return({x:vec1.x-vec2.x,y:vec1.y-vec2.y,z:vec1.z-vec2.z});
};
var vScale = function(vec,mag){
    return({x:mag*vec.x,y:mag*vec.y,z:mag*vec.z});
};
var vAnti = function(vec){
    return({x:-vec.x,y:-vec.y,z:-vec.z});
};
var vNormalize = function(vec){
    var d = sqrt(vec.x*vec.x+vec.y*vec.y+vec.z*vec.z);
    if(d){return({
        x:vec.x/d,
        y:vec.y/d,
        z:vec.z/d
    });}
    return({
        x:1,
        y:0,
        z:0,
    });
};

var angsToVector = function(azimuth,elevation){
    var vec = {x:0,y:0,z:1};
    
    if(elevation){
        var ang = atan2(vec.y,vec.z)+elevation;
        var dst = dist(vec.y,vec.z,0,0);
        vec.y = sin(ang)*dst;
        vec.z = cos(ang)*dst;
    }
    if(azimuth){
        var ang = atan2(vec.z,vec.x)+azimuth;
        var dst = dist(vec.z,vec.x,0,0);
        vec.z = sin(ang)*dst;
        vec.x = cos(ang)*dst;
    }
    
    return(vec);
};
var angBetweenVectors = function(vec1,vec2){
    return(
        acos(constrain((vec1.x*vec2.x+vec1.y*vec2.y+vec1.z*vec2.z)/vLength(vec1)/vLength(vec2),-1,1))
    );
    // acos of dot product
};
                        
/// ~~~~~~~~~~~~ Complex Math ~~~~~~~~~~~ ///
                    
var angToComplex = function(ang){
    if(ang){return({
        r:cos(ang),
        i:sin(ang),
    });}
    return({
        r:1,
        i:0
    });
};
var complexRotateAzimuth = function(point,complex){
    var nx = point.x*complex.r-point.z*complex.i,
        nz = point.x*complex.i+point.z*complex.r;
    point.x=nx;
    point.z=nz;
};// these rotate the point around the origin
var complexRotateElevation = function(point,complex){
    var nz = point.z*complex.r-point.y*complex.i,
        ny = point.z*complex.i+point.y*complex.r;
    point.z=nz;
    point.y=ny;
};
var complexRotateTwist = function(point,complex){
    var nx = point.x*complex.r-point.y*complex.i,
        ny = point.x*complex.i+point.y*complex.r;
    point.x=nx;
    point.y=ny;
};
var complexConjugate = function(complex){
    return({
        r:complex.r,
        i:-complex.i,
    });
};
var complexOne = {r:1,i:0};
                    
/// ~~~~~~~~~~~ Rotation Math ~~~~~~~~~~~ ///
                    
var angRotatePointATE = function(point,center,azimuth,elevation,twist){
    point.x-=center.x;
    point.y-=center.y;
    point.z-=center.z;
    
    // do azimuth first, because then it will rotate the axis such that doing a "pitch" in math will actually result in an elevation since the axis has been moved to that direction. doing "roll" ends up doing a twist
    
    // azimuth
    var ang = atan2(point.z,point.x)+azimuth;
    var dst = dist(point.z,point.x,0,0);
    point.z = sin(ang)*dst;
    point.x = cos(ang)*dst;
    // twist
    var ang = atan2(point.y,point.x)+twist;
    var dst = dist(point.y,point.x,0,0);
    point.y = sin(ang)*dst;
    point.x = cos(ang)*dst;
    // elevation
    var ang = atan2(point.y,point.z)+elevation;
    var dst = dist(point.y,point.z,0,0);
    point.y = sin(ang)*dst;
    point.z = cos(ang)*dst;
    
    point.x+=center.x;
    point.y+=center.y;
    point.z+=center.z;
}; // for camera rotation (rotation affects next axis in reference to world)
var angRotatePointTEA = function(point,center,azimuth,elevation,twist){
    point.x-=center.x;
    point.y-=center.y;
    point.z-=center.z;
    
    // do twist, then effects of twist are affected by elevation, then all of that is affected by azimuth, effectively accomplishing axis rotation by doing it backwards from how the brain imagines it
    
    if(twist){
        var ang = atan2(point.y,point.x)+twist;
        var dst = dist(point.y,point.x,0,0);
        point.y = sin(ang)*dst;
        point.x = cos(ang)*dst;
    }
    if(elevation){
        var ang = atan2(point.y,point.z)+elevation;
        var dst = dist(point.y,point.z,0,0);
        point.y = sin(ang)*dst;
        point.z = cos(ang)*dst;
    }
    if(azimuth){
        var ang = atan2(point.z,point.x)+azimuth;
        var dst = dist(point.z,point.x,0,0);
        point.z = sin(ang)*dst;
        point.x = cos(ang)*dst;
    }
    
    point.x+=center.x;
    point.y+=center.y;
    point.z+=center.z;
}; // for non-camera rotation (rotation affects previous rotations in reference to world)
var angRotatePointEAT = function(point,center,azimuth,elevation,twist){
    point.x-=center.x;
    point.y-=center.y;
    point.z-=center.z;
    
    // do twist, then effects of twist are affected by elevation, then all of that is affected by azimuth, effectively accomplishing axis rotation by doing it backwards from how the brain imagines it

    if(elevation){
        var ang = atan2(point.y,point.z)+elevation;
        var dst = dist(point.y,point.z,0,0);
        point.y = sin(ang)*dst;
        point.z = cos(ang)*dst;
    }
    if(azimuth){
        var ang = atan2(point.z,point.x)+azimuth;
        var dst = dist(point.z,point.x,0,0);
        point.z = sin(ang)*dst;
        point.x = cos(ang)*dst;
    }
    if(twist){
        var ang = atan2(point.y,point.x)+twist;
        var dst = dist(point.y,point.x,0,0);
        point.y = sin(ang)*dst;
        point.x = cos(ang)*dst;
    }
    
    point.x+=center.x;
    point.y+=center.y;
    point.z+=center.z;
}; // idk.

var complexRotatePointTEA = function(point,center,complexAzimuth,complexElevation,complexTwist){
    point.x-=center.x;
    point.y-=center.y;
    point.z-=center.z;
    complexRotateTwist(point,complexTwist);
    complexRotateElevation(point,complexElevation);
    complexRotateAzimuth(point,complexAzimuth);
    point.x+=center.x;
    point.y+=center.y;
    point.z+=center.z;
};

var angRotateTriTea = function(tri,center,azimuth,elevation,twist){
    angRotatePointTEA(tri.v1,center,azimuth,elevation,twist);
    angRotatePointTEA(tri.v2,center,azimuth,elevation,twist);
    angRotatePointTEA(tri.v3,center,azimuth,elevation,twist);
};
var angRotateQuaTea = function(qua,center,azimuth,elevation,twist){
    angRotatePointTEA(qua.v1,center,azimuth,elevation,twist);
    angRotatePointTEA(qua.v2,center,azimuth,elevation,twist);
    angRotatePointTEA(qua.v3,center,azimuth,elevation,twist);
    angRotatePointTEA(qua.v4,center,azimuth,elevation,twist);
};
var azimuthBetween = function(a,b){
    return(atan2(b.z-a.z,b.x-a.x)-90);
    // an extra 90 because instead of using x = forward, we're using z = forward since all things were based off of that.
};
var elevationBetween = function(a,b){
    return(atan2(b.y-a.y,dist(a.x,a.z,b.x,b.z)));
    // fit for TEA rotation
};
var angsToVectorTEA = function(azimuth,elevation){
    var vec = {x:0,y:0,z:1};
    angRotatePointTEA(vec,origin,azimuth,elevation,0);
    return(vec);
};
                    
/// ~~~~~~~~~~~~~~ 3D Math ~~~~~~~~~~~~~~ ///
                    
var origin = {x:0,y:0,z:0};
                        
sctpc = function(coord3D,zoomScales){
    return({
        x:zoomScales.zoomScaleX*(zoomScales.zoom||1)*coord3D.x/coord3D.z,
        y:zoomScales.zoomScaleY*(zoomScales.zoom||1)*coord3D.y/coord3D.z});
    // turns 3D coordinates into drawable 2D coordinates (assumes camera is at 0,0,0 facing positive z and only positive z, has 0 roll rotation, and that the point has a positive z value (clipped))
};

var pCopy = function(point){
    return({x:point.x,y:point.y,z:point.z});
};

var lerpPoints = function(a,b,value){
    return({
        x:a.x+(b.x-a.x)*value,
        y:a.y+(b.y-a.y)*value,
        z:a.z+(b.z-a.z)*value,
    });
};

var pointSideOfPlane = function(planePoint,planeNorm,target){
    return(vDotProduct(planeNorm,vSub(target,planePoint))>=0);
    /* 90 fov planes:
        (2) Left: {x:0,y:0,z:0},{x:1,y:0,z:1}
        (0) Right: {x:0,y:0,z:0},{x:-1,y:0,z:1}
        (1) Top: {x:0,y:0,z:0},{x:0,y:-1,z:1}
        (3) Bottom: {x:0,y:0,z:0},{x:0,y:1,z:1}
    */
    //return(vDotProduct(vNormalize(planeNorm),vNormalize(vSub(target,planePoint)))>=0);   ???
};
var pointStrictSideOfPlane = function(planePoint,planeNorm,target){
    return(vDotProduct(planeNorm,vSub(target,planePoint))>0.00000001);
};

var planeNameToNormal = function(planeName){
    return(c.sidePlaneNormals[planeName]);
};

var lineIntersectPlane = function(planePoint,planeNorm,a,b){
    planeNorm = vNormalize(planeNorm);
    var aDot = vDotProduct(a,planeNorm);
    return(vAdd(a,vScale(vSub(b,a),(aDot-vDotProduct(planeNorm,planePoint))/(aDot-vDotProduct(b,planeNorm)))));
    /*planeNorm = vNormalize(planeNorm);
    var planeD = -vDotProduct(planeNorm,planePoint);
    var ad = vDotProduct(a,planeNorm);
    var bd = vDotProduct(b,planeNorm);
    var t = (-planeD-ad)/(bd-ad);
    var atob = vSub(b,a);
    var lineToIntersect = vScale(atob,t);
    var ans = vAdd(a,lineToIntersect);
    return(ans);*/
    // point where line defined by a line segment intersects a plane defined by point and normal. assumes it actually is a point btw.
};
var lineQuickIntersectPlane = function(planeName,a,b){
    return(lineIntersectPlane(origin,c.sidePlaneNormals[planeName],a,b));
};
var pointCastOntoPlane = function(planePoint,planeNorm,a){
    // is basically just lineIntersectPlane except using the planeNorm as a normal to calculate where b could be
    planeNorm = vNormalize(planeNorm);
    var aDot = vDotProduct(a,planeNorm);
    return(vAdd(a,vScale(planeNorm,(aDot-vDotProduct(planeNorm,planePoint))/(aDot-vDotProduct(vAdd(a,planeNorm),planeNorm)))));
};
var lineToPointNormal = function(a,b,target){
    return(vCrossProduct(vCrossProduct(vSub(b,target),vSub(a,target)),vSub(a,b)));
    //var normalToNormalToPoint = vCrossProduct(vSub(b,target),vSub(a,target));
    // used to define a plane that contains an edge and faces a target point, in order to figure out cases for point to triangle shortest distance.
};

var midPoint = function(v1,v2){
    return({
        x:(v1.x+v2.x)/2,
        y:(v1.y+v2.y)/2,
        z:(v1.z+v2.z)/2,
    });
};
var triCenter = function(tri){
    return({x:(tri.v1.x+tri.v2.x+tri.v3.x)/3,y:(tri.v1.y+tri.v2.y+tri.v3.y)/3,z:(tri.v1.z+tri.v2.z+tri.v3.z)/3,});
};
var quaCenter = function(qua){
    return({x:(qua.v1.x+qua.v2.x+qua.v3.x+qua.v4.x)/4,y:(qua.v1.y+qua.v2.y+qua.v3.y+qua.v4.y)/4,z:(qua.v1.z+qua.v2.z+qua.v3.z+qua.v4.z)/4});
};
var threePointNormal = function(tri){
    return(vCrossProduct(vSub(tri.v2,tri.v1),vSub(tri.v3,tri.v1)));
    // perpendicular value. (supports clockwise = forward)
};

var pointQuickCheckPlane = function(planeName,target){
    return(pointSideOfPlane(origin,c.sidePlaneNormals[planeName],target));
};
var triQuickCheckPlane = function(planeName,tri){
    return(pointQuickCheckPlane(planeName,tri.v1)+pointQuickCheckPlane(planeName,tri.v2)+pointQuickCheckPlane(planeName,tri.v3));
}; // heavy at large scale
var quaQuickCheckPlane = function(planeName,qua){
    return(pointQuickCheckPlane(planeName,qua.v1)+pointQuickCheckPlane(planeName,qua.v2)+pointQuickCheckPlane(planeName,qua.v3)+pointQuickCheckPlane(planeName,qua.v4));
}; // heavy at large scale
var triHasPositiveZVertex = function(tri){
    if(tri.v1.z>0){return(true);}
    if(tri.v2.z>0){return(true);}
    if(tri.v3.z>0){return(true);}
    return(false);
};
var quaHasPositiveZVertex = function(qua){
    if(qua.v1.z>0){return(true);}
    if(qua.v2.z>0){return(true);}
    if(qua.v3.z>0){return(true);}
    if(qua.v4.z>0){return(true);}
    return(false);
};

var pointIsCloserToExternalOfLine = function(a,b,target){
    if(pointSideOfPlane(a,vSub(a,b),target)){
        return(true);
    }
    if(pointSideOfPlane(b,vSub(b,a),target)){
        return(true);
    }
    return(false);
    // made to fix the Obtuse Overlapping Oversight. so sad that this will make everything like super expensive if it doesn't immediately see vertex closeness
};
var pointIsStrictlyCloserToExternalOfLine = function(a,b,target){
    if(pointStrictSideOfPlane(a,vSub(a,b),target)){
        return(true);
    }
    if(pointStrictSideOfPlane(b,vSub(b,a),target)){
        return(true);
    }
    return(false);
};

var distPointToPoint = function(a,b){
    return(sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y)+(a.z-b.z)*(a.z-b.z)));
};
var distPointToLine = function(a,b,target){
    return(
        vLength(
            vCrossProduct(
                vSub(target,a),
                vSub(target,b)
            )
        )/
        vLength(vSub(b,a))
    );
    //https://mathworld.wolfram.com/Point-LineDistance3-Dimensional.html
};
var distPointToPlane = function(planePoint,planeNorm,target){
    return(distPointToPoint(target,lineIntersectPlane(planePoint,planeNorm,target,vAdd(target,planeNorm))));
    
    /*var thing=abs(planeNorm.x*target.x+planeNorm.y*target.y+planeNorm.z*target.z-planeNorm.x*planePoint.x-planeNorm.y*planePoint.y-planeNorm.z*planePoint.z);
    return(thing/vLength(planeNorm));*/
    // above code probably also works
};
var distPointToTri = function(tri,target){
    // vertex regions (check first for logic structure reasons)
    if(vDotProduct(vSub(tri.v1,tri.v2),vSub(target,tri.v2))<0.00000001&&vDotProduct(vSub(tri.v3,tri.v2),vSub(target,tri.v2))<0.00000001){return(distPointToPoint(tri.v2,target));}
    if(vDotProduct(vSub(tri.v2,tri.v3),vSub(target,tri.v3))<0.00000001&&vDotProduct(vSub(tri.v1,tri.v3),vSub(target,tri.v3))<0.00000001){return(distPointToPoint(tri.v3,target));}
    if(vDotProduct(vSub(tri.v3,tri.v1),vSub(target,tri.v1))<0.00000001&&vDotProduct(vSub(tri.v2,tri.v1),vSub(target,tri.v1))<0.00000001){return(distPointToPoint(tri.v1,target));}
    // edge regions
    if(vDotProduct(lineToPointNormal(tri.v1,tri.v2,tri.v3),vSub(target,tri.v1))<0&&!pointIsStrictlyCloserToExternalOfLine(tri.v1,tri.v2,target)){return(distPointToLine(tri.v1,tri.v2,target));}
    if(vDotProduct(lineToPointNormal(tri.v2,tri.v3,tri.v1),vSub(target,tri.v2))<0&&!pointIsStrictlyCloserToExternalOfLine(tri.v2,tri.v3,target)){return(distPointToLine(tri.v2,tri.v3,target));}
    if(vDotProduct(lineToPointNormal(tri.v3,tri.v1,tri.v2),vSub(target,tri.v3))<0&&!pointIsStrictlyCloserToExternalOfLine(tri.v3,tri.v1,target)){return(distPointToLine(tri.v3,tri.v1,target));}
    // it must be the central plane region
    return(distPointToPlane(tri.v1,threePointNormal(tri),target));
};
var distPointToQua = function(qua,target){
    // vertex regions (check first for logic structure reasons)
    if(vDotProduct(vSub(qua.v4,qua.v1),vSub(target,qua.v1))<0.00000001&&vDotProduct(vSub(qua.v2,qua.v1),vSub(target,qua.v1))<0.00000001){return(distPointToPoint(qua.v1,target));}
    if(vDotProduct(vSub(qua.v1,qua.v2),vSub(target,qua.v2))<0.00000001&&vDotProduct(vSub(qua.v3,qua.v2),vSub(target,qua.v2))<0.00000001){return(distPointToPoint(qua.v2,target));}
    if(vDotProduct(vSub(qua.v2,qua.v3),vSub(target,qua.v3))<0.00000001&&vDotProduct(vSub(qua.v4,qua.v3),vSub(target,qua.v3))<0.00000001){return(distPointToPoint(qua.v3,target));}
    if(vDotProduct(vSub(qua.v3,qua.v4),vSub(target,qua.v4))<0.00000001&&vDotProduct(vSub(qua.v1,qua.v4),vSub(target,qua.v4))<0.00000001){return(distPointToPoint(qua.v4,target));}
    // edge regions
    if(vDotProduct(lineToPointNormal(qua.v1,qua.v2,qua.v4),vSub(target,qua.v1))<0&&!pointIsStrictlyCloserToExternalOfLine(qua.v1,qua.v2,target)){return(distPointToLine(qua.v1,qua.v2,target));}
    if(vDotProduct(lineToPointNormal(qua.v2,qua.v3,qua.v1),vSub(target,qua.v2))<0&&!pointIsStrictlyCloserToExternalOfLine(qua.v2,qua.v3,target)){return(distPointToLine(qua.v2,qua.v3,target));}
    if(vDotProduct(lineToPointNormal(qua.v3,qua.v4,qua.v2),vSub(target,qua.v3))<0&&!pointIsStrictlyCloserToExternalOfLine(qua.v3,qua.v4,target)){return(distPointToLine(qua.v3,qua.v4,target));}
    if(vDotProduct(lineToPointNormal(qua.v4,qua.v1,qua.v3),vSub(target,qua.v4))<0&&!pointIsStrictlyCloserToExternalOfLine(qua.v4,qua.v1,target)){return(distPointToLine(qua.v4,qua.v1,target));}
    // it must be the central plane region
    return(distPointToPlane(qua.v1,threePointNormal(qua),target));
};
var distOriginToLine = function(a,b){
    return(
        vLength(
            vCrossProduct(
                vAnti(a),
                vAnti(b) // idk if these vAntis are needed
            )
        )/
        vLength(vSub(b,a))
    );
};
var distPointToLineSegment = function(a,b,target){
    if(pointSideOfPlane(a,vSub(a,b),target)){
        return(distPointToPoint(target,a));
    }
    if(pointSideOfPlane(b,vSub(b,a),target)){
        return(distPointToPoint(target,b));
    }
    return(distPointToLine(a,b,target));
};
var distOriginToTri = function(tri){
    // vertex regions (check first for logic structure reasons)
    if(vDotProduct(vSub(tri.v1,tri.v2),vAnti(tri.v2))<0.00000001&&vDotProduct(vSub(tri.v3,tri.v2),vAnti(tri.v2))<0.00000001){return(vLength(tri.v2));}
    if(vDotProduct(vSub(tri.v2,tri.v3),vAnti(tri.v3))<0.00000001&&vDotProduct(vSub(tri.v1,tri.v3),vAnti(tri.v3))<0.00000001){return(vLength(tri.v3));}
    if(vDotProduct(vSub(tri.v3,tri.v1),vAnti(tri.v1))<0.00000001&&vDotProduct(vSub(tri.v2,tri.v1),vAnti(tri.v1))<0.00000001){return(vLength(tri.v1));}
    // edge regions
    if(vDotProduct(lineToPointNormal(tri.v1,tri.v2,tri.v3),vAnti(tri.v1))<0&&!pointIsStrictlyCloserToExternalOfLine(tri.v1,tri.v2,origin)){return(distOriginToLine(tri.v1,tri.v2));}
    if(vDotProduct(lineToPointNormal(tri.v2,tri.v3,tri.v1),vAnti(tri.v2))<0&&!pointIsStrictlyCloserToExternalOfLine(tri.v2,tri.v3,origin)){return(distOriginToLine(tri.v2,tri.v3));}
    if(vDotProduct(lineToPointNormal(tri.v3,tri.v1,tri.v2),vAnti(tri.v3))<0&&!pointIsStrictlyCloserToExternalOfLine(tri.v3,tri.v1,origin)){return(distOriginToLine(tri.v3,tri.v1));}
    // it must be the central plane region
    return(distPointToPlane(tri.v1,threePointNormal(tri),origin));
};
var distOriginToQua = function(qua){
    
    // ngl pretty sure these 0.00000001s are not needed anymore due to the Obtuse Fix but it makes perfect edge cases prioritize the most performant cases sooooo...
    
    if(vDotProduct(vSub(qua.v4,qua.v1),vAnti(qua.v1))<0.00000001&&vDotProduct(vSub(qua.v2,qua.v1),vAnti(qua.v1))<0.00000001){return(vLength(qua.v1));}
    if(vDotProduct(vSub(qua.v1,qua.v2),vAnti(qua.v2))<0.00000001&&vDotProduct(vSub(qua.v3,qua.v2),vAnti(qua.v2))<0.00000001){return(vLength(qua.v2));}
    if(vDotProduct(vSub(qua.v2,qua.v3),vAnti(qua.v3))<0.00000001&&vDotProduct(vSub(qua.v4,qua.v3),vAnti(qua.v3))<0.00000001){return(vLength(qua.v3));}
    if(vDotProduct(vSub(qua.v3,qua.v4),vAnti(qua.v4))<0.00000001&&vDotProduct(vSub(qua.v1,qua.v4),vAnti(qua.v4))<0.00000001){return(vLength(qua.v4));}
    if(vDotProduct(lineToPointNormal(qua.v1,qua.v2,qua.v4),vAnti(qua.v1))<0&&!pointIsStrictlyCloserToExternalOfLine(qua.v1,qua.v2,origin)){return(distOriginToLine(qua.v1,qua.v2));}
    if(vDotProduct(lineToPointNormal(qua.v2,qua.v3,qua.v1),vAnti(qua.v2))<0&&!pointIsStrictlyCloserToExternalOfLine(qua.v2,qua.v3,origin)){return(distOriginToLine(qua.v2,qua.v3));}
    if(vDotProduct(lineToPointNormal(qua.v3,qua.v4,qua.v2),vAnti(qua.v3))<0&&!pointIsStrictlyCloserToExternalOfLine(qua.v3,qua.v4,origin)){return(distOriginToLine(qua.v3,qua.v4));}
    if(vDotProduct(lineToPointNormal(qua.v4,qua.v1,qua.v3),vAnti(qua.v4))<0&&!pointIsStrictlyCloserToExternalOfLine(qua.v4,qua.v1,origin)){return(distOriginToLine(qua.v4,qua.v1));}
    return(distPointToPlane(qua.v1,threePointNormal(qua),origin));
};
var depth = function(graphic){
    switch(graphic.type){
        case "tri":
            return(distOriginToTri(graphic));
        case "qua":
            return(distOriginToQua(graphic));
        case "dot":
            return(vLength(graphic));
        case "lin":
            return(distPointToLineSegment(graphic.v1,graphic.v2,origin));
    }
};

var shiftTri = function(tri,x,y,z){
    tri.v1.x+=x; tri.v2.x+=x; tri.v3.x+=x;
    tri.v1.y+=y; tri.v2.y+=y; tri.v3.y+=y;
    tri.v1.z+=z; tri.v2.z+=z; tri.v3.z+=z;
};
var shiftQua = function(qua,x,y,z){
    qua.v1.x+=x; qua.v2.x+=x; qua.v3.x+=x; qua.v4.x+=x;
    qua.v1.y+=y; qua.v2.y+=y; qua.v3.y+=y; qua.v4.y+=y;
    qua.v1.z+=z; qua.v2.z+=z; qua.v3.z+=z; qua.v4.z+=z;
};
var scaleTri = function(tri,l,h,w){
    tri.v1.x*=l; tri.v2.x*=l; tri.v3.x*=l;
    tri.v1.y*=h; tri.v2.y*=h; tri.v3.y*=h;
    tri.v1.z*=w; tri.v2.z*=w; tri.v3.z*=w;
};
var scaleQua = function(qua,l,h,w){
    qua.v1.x*=l; qua.v2.x*=l; qua.v3.x*=l; qua.v4.x*=l;
    qua.v1.y*=h; qua.v2.y*=h; qua.v3.y*=h; qua.v4.y*=h;
    qua.v1.z*=w; qua.v2.z*=w; qua.v3.z*=w; qua.v4.z*=w;
};

var setGoToPoint = function(obj,a){
    obj.x=a.x;
    obj.y=a.y;
    obj.z=a.z;
};
var setGoToCoords = function(obj,x,y,z){
    obj.x=x;
    obj.y=y;
    obj.z=z;
};
var setGoByVector = function(obj,vec){
    obj.x+=vec.x;
    obj.y+=vec.y;
    obj.z+=vec.z;
};
var setLookAtPoint = function(obj,a){
    obj.azimuth = azimuthBetween(obj,a);
    obj.elevation = elevationBetween(obj,a);
    if(obj.getComplexes!==undefined){
        obj.getComplexes();
    }
};
var setLookAtCoords = function(obj,x,y,z){
    var a = {x:x,y:y,z:z};
    obj.azimuth = azimuthBetween(c,a);
    obj.elevation = elevationBetween(c,a);
    if(obj.getComplexes!==undefined){
        obj.getComplexes();
    }
};
                    
/// ~~~~~~~~~~~~~~ Camera ~~~~~~~~~~~~~~~ ///
                    
var angAdjustPointForCamera = function(point){
    // uses modified ATE. (see rotatePointATE) and this kinda does make sense because it's doing reverse rotations so the axis order is reverse as well.
    point.x-=c.x;
    point.y-=c.y;
    point.z-=c.z;
    if(c.azimuth){
        var ang = atan2(point.z,point.x)-c.azimuth;
        var dst = dist(point.z,point.x,0,0);
        point.z = sin(ang)*dst;
        point.x = cos(ang)*dst;
    }
    if(c.twist){
        var ang = atan2(point.y,point.x)-c.twist;
        var dst = dist(point.y,point.x,0,0);
        point.y = sin(ang)*dst;
        point.x = cos(ang)*dst;
    }
    if(c.elevation){
        var ang = atan2(point.y,point.z)-c.elevation;
        var dst = dist(point.y,point.z,0,0);
        point.y = sin(ang)*dst;
        point.z = cos(ang)*dst;
    }
};
complexAdjustPointForCamera = function(point){
    point.x-=c.x;
    point.y-=c.y;
    point.z-=c.z;
    complexRotateAzimuth(point,c.antiComplexAzimuth);
    complexRotateTwist(point,c.antiComplexTwist);
    complexRotateElevation(point,c.antiComplexElevation);
}; // i think this one is the epic one?
var complexAdjustPointAgainstCamera = function(point){
    complexRotateAzimuth(point,complexConjugate(c.antiComplexAzimuth));
    complexRotateTwist(point,complexConjugate(c.antiComplexTwist));
    complexRotateElevation(point,complexConjugate(c.antiComplexElevation));
    point.x+=c.x;
    point.y+=c.y;
    point.z+=c.z;
};
var complexAdjustVectorForCamera = function(vec){
    complexRotateAzimuth(vec,c.antiComplexAzimuth);
    complexRotateTwist(vec,c.antiComplexTwist);
    complexRotateElevation(vec,c.antiComplexElevation);
};
var adjustTriForCamera = function(tri){
    complexAdjustPointForCamera(tri.v1);
    complexAdjustPointForCamera(tri.v2);
    complexAdjustPointForCamera(tri.v3);
};
var adjustQuaForCamera = function(qua){
    complexAdjustPointForCamera(qua.v1);
    complexAdjustPointForCamera(qua.v2);
    complexAdjustPointForCamera(qua.v3);
    complexAdjustPointForCamera(qua.v4);
};
var adjustForCamera = function(graphic){
    switch(graphic.type){
        case "tri":
            complexAdjustPointForCamera(graphic.v1);
            complexAdjustPointForCamera(graphic.v2);
            complexAdjustPointForCamera(graphic.v3);
            break;
        case "qua":
            complexAdjustPointForCamera(graphic.v1);
            complexAdjustPointForCamera(graphic.v2);
            complexAdjustPointForCamera(graphic.v3);
            complexAdjustPointForCamera(graphic.v4);
            break;
        case "dot":
            complexAdjustPointForCamera(graphic);
            break;
        case "lin":
            complexAdjustPointForCamera(graphic.v1);
            complexAdjustPointForCamera(graphic.v2);
            break;
    }
};


                    
/// ~~~~~~~~~~~~~ Lighting ~~~~~~~~~~~~~~ ///
                    
var defaultLightingExponentBase = 2; // 2
var defaultLightingMidRange = 4; // 4
var defaultLightingMaxHarsh = 0.2; // 0 to 1
var defaultLightingShadowNerfFactor = 0.85;
var lightSources = [];
var lightVectors = [];
// {x,y,z,strength,midrange,exponentBase}
var createLightSource = function(x,y,z,strength,midRange,exponentBase,maxHarsh){
    lightSources.push({
        x:x,
        y:y,
        z:z,
        strength:strength,
        midRange:midRange||defaultLightingMidRange,
        exponentBase:exponentBase||defaultLightingExponentBase,
    });
    if(maxHarsh===undefined){lightSources[lightSources.length-1].maxHarsh=defaultLightingMaxHarsh;}
    else{lightSources[lightSources.length-1].maxHarsh=maxHarsh;}
    complexAdjustPointForCamera(lightSources[lightSources.length-1]);
};
var createLightVector = function(vec,strength,maxHarsh){
    lightVectors.push({
        x:vec.x,
        y:vec.y,
        z:vec.z,
        strength:strength,
    });
    if(maxHarsh===undefined){lightVectors[lightVectors.length-1].maxHarsh=defaultLightingMaxHarsh;}
    else{lightVectors[lightVectors.length-1].maxHarsh=maxHarsh;}
    complexAdjustVectorForCamera(lightVectors[lightVectors.length-1]);
};
var calculateLightingForRenderable = function(graphic){
    if(graphic.lighting===undefined){graphic.lighting=0;}
    if(graphic.type==="tri"||graphic.type==="qua"){
        var center;
        if(graphic.type==="tri"){
            center=triCenter(graphic);
        }
        else{
            center=quaCenter(graphic);
        }
        for(var i = 0; i<lightSources.length; i++){
            var d = distPointToPoint(center,lightSources[i]);
            
            //https://www.desmos.com/calculator/8wcptgitib
            var closeness = (1-1/(1+pow(lightSources[i].exponentBase,lightSources[i].midRange-d)))/(1-1/(1+pow(lightSources[i].exponentBase,lightSources[i].midRange))); // 1 to 0
            var intensity = vDotProduct(vNormalize(vSub(lightSources[i],center)),vNormalize(threePointNormal(graphic))); // -1 to 1
            
            if(intensity<-0.3){intensity*=defaultLightingShadowNerfFactor;}
            // make shadows slightly less shadowy
            
            graphic.lighting+=lightSources[i].strength*closeness*map(intensity,-defaultLightingShadowNerfFactor,1,lightSources[i].maxHarsh,1);
        }
        for(var i = 0; i<lightVectors.length; i++){
            var intensity = vDotProduct(vNormalize(vAnti(lightVectors[i])),vNormalize(threePointNormal(graphic)));
            
            if(intensity<-0.3){intensity*=defaultLightingShadowNerfFactor;}
            
            graphic.lighting+=lightVectors[i].strength*map(intensity,-defaultLightingShadowNerfFactor,1,lightVectors[i].maxHarsh,1);
        }
    }
    else if(graphic.type==="dot"){
        for(var i = 0; i<lightSources.length; i++){
            var d = distPointToPoint(graphic,lightSources[i]);
            var closeness = (1-1/(1+pow(lightSources[i].exponentBase,lightSources[i].midRange-d)))/(1-1/(1+pow(lightSources[i].exponentBase,lightSources[i].midRange))); // 1 to 0
            var intensity = vDotProduct(vNormalize(vSub(graphic,lightSources[i])),vNormalize(graphic)); // -1 to 1
            
            if(intensity<-0.3){intensity*=defaultLightingShadowNerfFactor;}
            graphic.lighting+=lightSources[i].strength*closeness*map(intensity,-defaultLightingShadowNerfFactor,1,lightSources[i].maxHarsh,1);
        }
        for(var i = 0; i<lightVectors.length; i++){
            var intensity = vDotProduct(vNormalize(vAnti(lightVectors[i])),vNormalize(graphic)); // -1 to 1
            
            if(intensity<-0.3){intensity*=defaultLightingShadowNerfFactor;}
            graphic.lighting+=lightSources[i].strength*map(intensity,-defaultLightingShadowNerfFactor,1,lightSources[i].maxHarsh,1);
        }
    }
    else if(graphic.type==="lin"){
        for(var i = 0; i<lightSources.length; i++){
            var d = distPointToPoint(midPoint(graphic.v1,graphic.v2),lightSources[i]);
            var closeness = (1-1/(1+pow(lightSources[i].exponentBase,lightSources[i].midRange-d)))/(1-1/(1+pow(lightSources[i].exponentBase,lightSources[i].midRange))); // 1 to 0
            var intensity = vDotProduct(vNormalize(vSub(midPoint(graphic.v1,graphic.v2),lightSources[i])),vNormalize(midPoint(graphic.v1,graphic.v2))); // -1 to 1
            
            if(intensity<-0.3){intensity*=defaultLightingShadowNerfFactor;}
            graphic.lighting+=lightSources[i].strength*closeness*map(intensity,-defaultLightingShadowNerfFactor,1,lightSources[i].maxHarsh,1);
        }
        for(var i = 0; i<lightVectors.length; i++){
            var intensity = vDotProduct(vNormalize(vAnti(lightVectors[i])),vNormalize(midPoint(graphic.v1,graphic.v2))); // -1 to 1
            
            if(intensity<-0.3){intensity*=defaultLightingShadowNerfFactor;}
            graphic.lighting+=lightSources[i].strength*map(intensity,-defaultLightingShadowNerfFactor,1,lightSources[i].maxHarsh,1);
        }
    }
};
var applyLightingToRenderable = function(graphic){
    var lightingFactor = pow(graphic.lighting,0.4);
    graphic.col[0]*=lightingFactor;
    graphic.col[1]*=lightingFactor;
    graphic.col[2]*=lightingFactor;
};
                    
/// ~~~~~~ (OUTDATED) 2D Rendering ~~~~~~~ ///
                   
var chonky2dTriangle = function(v1,v2,v3){
    var center = {
        x:(v1.x+v2.x+v3.x)/3,
        y:(v1.y+v2.y+v3.y)/3,
    };
    triangle(
        v1.x+(v1.x-center.x)/dist2d(center,v1),
        v1.y+(v1.y-center.y)/dist2d(center,v1),
        v2.x+(v2.x-center.x)/dist2d(center,v2),
        v2.y+(v2.y-center.y)/dist2d(center,v2),
        v3.x+(v3.x-center.x)/dist2d(center,v3),
        v3.y+(v3.y-center.y)/dist2d(center,v3)
    );
};
var chonky2dQuad = function(v1,v2,v3,v4){
    var center = {
        x:(v1.x+v2.x+v3.x+v4.x)/4,
        y:(v1.y+v2.y+v3.y+v4.y)/4,
    };
    //if(dist2d(v1,center)>2&&dist2d(v2,center)>2&&dist2d(v3,center)>2&&dist2d(v4,center)>2){
    quad(
        v1.x+(v1.x-center.x)/dist2d(center,v1),
        v1.y+(v1.y-center.y)/dist2d(center,v1),
        v2.x+(v2.x-center.x)/dist2d(center,v2),
        v2.y+(v2.y-center.y)/dist2d(center,v2),
        v3.x+(v3.x-center.x)/dist2d(center,v3),
        v3.y+(v3.y-center.y)/dist2d(center,v3),
        v4.x+(v4.x-center.x)/dist2d(center,v4),
        v4.y+(v4.y-center.y)/dist2d(center,v4)
    );
};
                    
/// ~~~~~~~~~~~ 3D Rendering ~~~~~~~~~~~~ ///
              
var renderClippedTriangle = function(tri){ // replaced with renderClippedVerts
    if(tri.col.length<4){
        tri.col[3]=255;
    }
    fill(tri.col[0],tri.col[1],tri.col[2],tri.col[3]);
    
    chonky2dTriangle(sctpc(tri.v1,c),sctpc(tri.v2,c),sctpc(tri.v3,c));
};
var renderClippedQuad = function(qua){ // replaced with renderClippedVerts
    if(qua.col.length<4){
        qua.col[3]=255;
    }
    fill(qua.col[0],qua.col[1],qua.col[2],qua.col[3]);
    
    chonky2dQuad(sctpc(qua.v1,c),sctpc(qua.v2,c),sctpc(qua.v3,c),sctpc(qua.v4,c));
};
var renderClippedVerts = function(verts,col){
    if(col.length<4){
        col[3]=255;
    }
    fill(col[0],col[1],col[2],col[3]);
    
    
    var coords2d = [];
    var center = {x:0,y:0};
    for(var i = 0; i<verts.length; i++){
        coords2d[i]=sctpc(verts[i],c);
        center.x+=coords2d[i].x;
        center.y+=coords2d[i].y;
    }
    center.x/=verts.length;
    center.y/=verts.length;
    beginShape();
    for(var i = 0; i<verts.length; i++){
        var invDst = 1/(1+dist2d(center,coords2d[i]));
        vertex(
            coords2d[i].x+(coords2d[i].x-center.x)*invDst,
            coords2d[i].y+(coords2d[i].y-center.y)*invDst
        );
    }
    endShape(CLOSE);
};
var clipAndRender = function(graphic){
    if(graphic.type==="tri"||graphic.type==="qua"){
        // clip
        var verts = [graphic.v1,graphic.v2,graphic.v3];
        if(graphic.type==="qua"){
            verts[3]=graphic.v4;
        }
        
        for(var i = 0; i<c.sidePlaneNormals.length; i++){
            var outPlane = [];
            var clippingIsNeeded = false;
            for(var j = 0; j<verts.length; j++){
                outPlane[j] = !pointQuickCheckPlane(i,verts[j]);
                if(outPlane[j]){clippingIsNeeded=true;}
            }
            if(clippingIsNeeded){
                for(var j = 0; j<verts.length; j++){
                    if(outPlane[j]!==outPlane[anyModulo(j-1,verts.length)]){
                        // inject the added vertex
                        verts.splice(j,0,lineQuickIntersectPlane(i,verts[j],verts[anyModulo(j-1,verts.length)]));
                        outPlane.splice(j,0,false);
                        j++;
                    }
                }
                for(var j = verts.length-1; j>-1; j--){
                    if(outPlane[j]){
                        verts.splice(j,1);
                    }
                }
            }
        }
        
        for(var i = 0; i<c.customPlanes.length; i++){
            var outPlane = [];
            var clippingIsNeeded = false;
            for(var j = 0; j<verts.length; j++){
                outPlane[j] = !pointSideOfPlane(c.customPlanes[i].point,c.customPlanes[i].norm,verts[j]);
                if(outPlane[j]){clippingIsNeeded=true;}
            }
            if(clippingIsNeeded){
                for(var j = 0; j<verts.length; j++){
                    if(outPlane[j]!==outPlane[anyModulo(j-1,verts.length)]){
                        // inject the added vertex
                        verts.splice(j,0,lineIntersectPlane(c.customPlanes[i].point,c.customPlanes[i].norm,verts[j],verts[anyModulo(j-1,verts.length)]));
                        outPlane.splice(j,0,false);
                        j++;
                    }
                }
                for(var j = verts.length-1; j>-1; j--){
                    if(outPlane[j]){
                        verts.splice(j,1);
                    }
                }
            }
        }
        
        // render
        if(verts.length){
            renderClippedVerts(verts,graphic.col);
        }
    }
    else if(graphic.type==="dot"){
        fill(graphic.col[0],graphic.col[1],graphic.col[2],graphic.col[3]);
        var pos = sctpc(graphic,c);
        if(graphic.renderType==="circle"){
            ellipse(pos.x,pos.y,graphic.rad*2+1,graphic.rad*2+1);
        }
        else if(graphic.renderType==="square"){
            push();
            translate(pos.x,pos.y);
            rotate(graphic.renderRotation);
            rect(-graphic.rad,-graphic.rad,graphic.rad*2,graphic.rad*2);
            pop();
        }
        else if(graphic.renderType==="triangle"){
            push();
            translate(pos.x,pos.y);
            rotate(graphic.renderRotation);
            triangle(-0.5*graphic.rad,sqrt(3)/2*graphic.rad,graphic.rad,0,-0.5*graphic.rad,-sqrt(3)/2*graphic.rad);
            pop();
        }
    }
    else if(graphic.type==="lin"){
        var drawIt = true;
        for(var i = 0; i<c.sidePlaneNormals.length; i++){
            var aOut = !pointQuickCheckPlane(i,graphic.v1);
            var bOut = !pointQuickCheckPlane(i,graphic.v2);
            
            if(aOut){
                if(bOut){
                    drawIt=false;
                    break;
                }
                // bIn aOut
                graphic.v1=lineQuickIntersectPlane(i,graphic.v1,graphic.v2);
            }
            else if(bOut){
                // aIn bOut
                graphic.v2=lineQuickIntersectPlane(i,graphic.v1,graphic.v2);
            }
        }
        
        if(drawIt){
            stroke(graphic.col[0],graphic.col[1],graphic.col[2],graphic.col[3]);
            strokeWeight(graphic.rad*2);
            var pos1 = sctpc(graphic.v1,c);
            var pos2 = sctpc(graphic.v2,c);
            line(pos1.x,pos1.y,pos2.x,pos2.y);
            noStroke();
        }
    }
    else{
        console.log("\""+graphic.type+"\" is an unknown type of graphic");
    }
};
var queueClippedVertsToWebgl = function(verts, col){
	if(col.length < 4){
		col[3] = 255;
	}
	
	var coords2d = [];
	var center = {x: 0, y: 0};
	for(var i = 0; i < verts.length; i++){
		coords2d[i] = sctpc(verts[i], c);
		center.x += coords2d[i].x;
		center.y += coords2d[i].y;
	}
	center.x /= verts.length;
	center.y /= verts.length;
	
	for(var i = 1; i < verts.length - 1; i++){
		webglQueue.push({
			v1: chonkify(center, coords2d[0]),
			v2: chonkify(center, coords2d[i]),
			v3: chonkify(center, coords2d[i+1]),
			col: col.slice()
		});
	}
};
var chonkify = function(center, point){
	var invDst = 1 / (1 + dist2d(center, point));
	return {
		x: point.x + (point.x - center.x) * invDst,
		y: point.y + (point.y - center.y) * invDst
	};
}
var clipAndQueueToWebgl = function(graphic){
	if(graphic.type === "tri" || graphic.type === "qua"){
		var verts = [graphic.v1, graphic.v2, graphic.v3];
		if(graphic.type === "qua"){
			verts[3] = graphic.v4;
		}
		
		for(var i = 0; i < c.sidePlaneNormals.length; i++){
			var outPlane = [], clippingIsNeeded = false;
			for(var j = 0; j < verts.length; j++){
				outPlane[j] = !pointQuickCheckPlane(i, verts[j]);
				if(outPlane[j]) clippingIsNeeded = true;
			}
			if(clippingIsNeeded){
				for(var j = 0; j < verts.length; j++){
					if(outPlane[j] !== outPlane[anyModulo(j-1, verts.length)]){
						verts.splice(j, 0, lineQuickIntersectPlane(i, verts[j], verts[anyModulo(j-1, verts.length)]));
						outPlane.splice(j, 0, false);
						j++;
					}
				}
				for(var j = verts.length - 1; j >= 0; j--){
					if(outPlane[j]) verts.splice(j, 1);
				}
			}
		}
		
		for(var i = 0; i < c.customPlanes.length; i++){
			var outPlane = [], clippingIsNeeded = false;
			for(var j = 0; j < verts.length; j++){
				outPlane[j] = !pointSideOfPlane(c.customPlanes[i].point, c.customPlanes[i].norm, verts[j]);
				if(outPlane[j]) clippingIsNeeded = true;
			}
			if(clippingIsNeeded){
				for(var j = 0; j < verts.length; j++){
					if(outPlane[j] !== outPlane[anyModulo(j-1, verts.length)]){
						verts.splice(j, 0, lineIntersectPlane(c.customPlanes[i].point, c.customPlanes[i].norm, verts[j], verts[anyModulo(j-1, verts.length)]));
						outPlane.splice(j, 0, false);
						j++;
					}
				}
				for(var j = verts.length - 1; j >= 0; j--){
					if(outPlane[j]) verts.splice(j, 1);
				}
			}
		}
		
		if(verts.length >= 3){
			queueClippedVertsToWebgl(verts, graphic.col);
		}
	}
	else if(graphic.type === "dot"){
		var pos = sctpc(graphic, c);
		if(graphic.renderType === "circle"){
			var numSegs = 20;
			var angleStep = TWO_PI / numSegs;
			var verts = [];
			for(var i = 0; i < numSegs; i++){
				var a1 = i * angleStep;
				var a2 = (i+1) * angleStep;
				var x1 = graphic.rad * cos(a1);
				var y1 = graphic.rad * sin(a1);
				var x2 = graphic.rad * cos(a2);
				var y2 = graphic.rad * sin(a2);
				verts.push([
					{x: pos.x, y: pos.y},
					{x: pos.x + x1, y: pos.y + y1},
					{x: pos.x + x2, y: pos.y + y2}
				]);
			}
			for(var i = 0; i < verts.length; i++){
				webglQueue.push({
					v1: verts[i][0],
					v2: verts[i][1],
					v3: verts[i][2],
					col: graphic.col.slice()
				});
			}
		}
		else if(graphic.renderType === "square"){
			var r = graphic.rad;
			var verts = [
				{x: -r, y: -r},
				{x:  r, y: -r},
				{x:  r, y:  r},
				{x: -r, y:  r}
			];
			var sinA = sin(graphic.renderRotation), cosA = cos(graphic.renderRotation);
			for(var i = 0; i < verts.length; i++){
				var x = verts[i].x, y = verts[i].y;
				verts[i] = {
					x: pos.x + cosA * x - sinA * y,
					y: pos.y + sinA * x + cosA * y
				};
			}
			webglQueue.push({
				v1: verts[0],
				v2: verts[1],
				v3: verts[2],
				col: graphic.col.slice()
			});
			webglQueue.push({
				v1: verts[0],
				v2: verts[2],
				v3: verts[3],
				col: graphic.col.slice()
			});
		}
		else if(graphic.renderType === "triangle"){
			var r = graphic.rad;
			var verts = [
				{x: -0.5 * r, y: sqrt(3)/2 * r},
				{x: r,        y: 0},
				{x: -0.5 * r, y: -sqrt(3)/2 * r}
			];
			var sinA = sin(graphic.renderRotation), cosA = cos(graphic.renderRotation);
			for(var i = 0; i < verts.length; i++){
				var x = verts[i].x, y = verts[i].y;
				verts[i] = {
					x: pos.x + cosA * x - sinA * y,
					y: pos.y + sinA * x + cosA * y
				};
			}
			webglQueue.push({
				v1: verts[0],
				v2: verts[1],
				v3: verts[2],
				col: graphic.col.slice()
			});
		}
	}
	else if(graphic.type === "lin"){
		var drawIt = true;
		var a = graphic.v1;
		var b = graphic.v2;
		
		for(var i = 0; i < c.sidePlaneNormals.length; i++){
			var aOut = !pointQuickCheckPlane(i, a);
			var bOut = !pointQuickCheckPlane(i, b);
			
			if(aOut && bOut){
				drawIt = false;
				break;
			}
			else if(aOut){
				a = lineQuickIntersectPlane(i, a, b);
			}
			else if(bOut){
				b = lineQuickIntersectPlane(i, a, b);
			}
		}
		
		if(drawIt){
			var p1 = sctpc(a, c);
			var p2 = sctpc(b, c);
			var dx = p2.x - p1.x;
			var dy = p2.y - p1.y;
			var len = sqrt(dx*dx + dy*dy);
			if(len < 0.001) return;
			
			var offX = -dy / len * graphic.rad;
			var offY = dx / len * graphic.rad;
			
			var verts = [
				{x: p1.x + offX, y: p1.y + offY},
				{x: p1.x - offX, y: p1.y - offY},
				{x: p2.x - offX, y: p2.y - offY},
				{x: p2.x + offX, y: p2.y + offY}
			];
			
			webglQueue.push({
				v1: verts[0],
				v2: verts[1],
				v3: verts[2],
				col: graphic.col.slice()
			});
			webglQueue.push({
				v1: verts[0],
				v2: verts[2],
				v3: verts[3],
				col: graphic.col.slice()
			});
		}
	}
	else{
		console.log("\"" + graphic.type + "\" is an unknown type of graphic");
	}
};

var renderWebglQueue = function(){
	noStroke();
	beginShape(TRIANGLES);
	for(var i = 0; i < webglQueue.length; i++){
		var tri = webglQueue[i];
		fill(tri.col[0], tri.col[1], tri.col[2], tri.col[3]);
		vertex(tri.v1.x, tri.v1.y);
		vertex(tri.v2.x, tri.v2.y);
		vertex(tri.v3.x, tri.v3.y);
	}
	endShape();
	webglQueue = [];
};
                    
/// ~~~~~~~~~~~ 3D Model Data ~~~~~~~~~~~ ///
                    
var emptyModel = {
    coordData:[],
    triData:[],
    quaData:[],
};
var cubeModel = {
    coordData:[
        {x:-1,y:-1,z:-1},
        {x:-1,y:-1,z:1},
        {x:-1,y:1,z:-1},
        {x:-1,y:1,z:1},
        {x:1,y:-1,z:-1},
        {x:1,y:-1,z:1},
        {x:1,y:1,z:-1},
        {x:1,y:1,z:1},
    ],
    triData:[],
    quaData:[
        {v1:0,v2:2,v3:6,v4:4}, // front
        {v1:5,v2:7,v3:3,v4:1}, // back
        {v1:1,v2:3,v3:2,v4:0}, // left
        {v1:4,v2:6,v3:7,v4:5}, // right
        {v1:2,v2:3,v3:7,v4:6}, // top
        {v1:4,v2:5,v3:1,v4:0}, // bottom
    ],
};
var octahedronModel = {
    coordData:[
        {x:0,y:1,z:0},
        {x:-1,y:0,z:0},
        {x:0,y:0,z:-1},
        {x:1,y:0,z:0},
        {x:0,y:0,z:1},
        {x:0,y:-1,z:0},
    ],
    triData:[
        {v1:5,v2:4,v3:1},
        {v1:5,v2:1,v3:2},
        {v1:5,v2:2,v3:3},
        {v1:5,v2:3,v3:4},
        {v1:0,v2:1,v3:4},
        {v1:0,v2:2,v3:1},
        {v1:0,v2:3,v3:2},
        {v1:0,v2:4,v3:3},
    ],
    quaData:[],
};
var icosahedronModel = {
    coordData:[
        {x:0,y:1,z:0},
        {x:1,y:0.525724,z:0},
        {x:0.309016994375,y:0.525724,z:0.951056516295},
        {x:-0.809016994375,y:0.525724,z:0.587785252292},
        {x:-0.809016994375,y:0.525724,z:-0.587785252292},
        {x:0.309016994375,y:0.525724,z:-0.951056516295},
        {x:0.809016994375,y:-0.525724,z:-0.587785252292},
        {x:0.809016994375,y:-0.525724,z:0.587785252292},
        {x:-0.309016994375,y:-0.525724,z:0.951056516295},
        {x:-1,y:-0.525724,z:0},
        {x:-0.309016994375,y:-0.525724,z:-0.951056516295},
        {x:0,y:-1,z:0},
    ],
    triData:[
        {v1:0,v2:2,v3:1},
        {v1:0,v2:3,v3:2},
        {v1:0,v2:4,v3:3},
        {v1:0,v2:5,v3:4},
        {v1:0,v2:1,v3:5},
        {v1:1,v2:2,v3:7},
        {v1:2,v2:3,v3:8},
        {v1:3,v2:4,v3:9},
        {v1:4,v2:5,v3:10},
        {v1:5,v2:1,v3:6},
        {v1:1,v2:7,v3:6},
        {v1:2,v2:8,v3:7},
        {v1:3,v2:9,v3:8},
        {v1:4,v2:10,v3:9},
        {v1:5,v2:6,v3:10},
        {v1:11,v2:10,v3:6},
        {v1:11,v2:6,v3:7},
        {v1:11,v2:7,v3:8},
        {v1:11,v2:8,v3:9},
        {v1:11,v2:9,v3:10},
    ],
    quaData:[],
};
var rhombicosidodecahedronModel = {
    coordData:[
        {x:-0.23607,y:0.23607,z:-1},
        {x:0.23607,y:0.23607,z:-1},
        {x:-0.23607,y:-0.23607,z:-1},
        {x:0.23607,y:-0.23607,z:-1},
        {x:-0.23607,y:0.23607,z:1},
        {x:0.23607,y:0.23607,z:1},
        {x:-0.23607,y:-0.23607,z:1},
        {x:0.23607,y:-0.23607,z:1},
        {x:-0.23607,y:1,z:-0.23607},
        {x:0.23607,y:1,z:-0.23607},
        {x:-0.23607,y:-1,z:-0.23607},
        {x:0.23607,y:-1,z:-0.23607},
        {x:-0.23607,y:1,z:0.23607},
        {x:0.23607,y:1,z:0.23607},
        {x:-0.23607,y:-1,z:0.23607},
        {x:0.23607,y:-1,z:0.23607},
        {x:-1,y:0.23607,z:-0.23607},
        {x:1,y:0.23607,z:-0.23607},
        {x:-1,y:-0.23607,z:-0.23607},
        {x:1,y:-0.23607,z:-0.23607},
        {x:-1,y:0.23607,z:0.23607},
        {x:1,y:0.23607,z:0.23607},
        {x:-1,y:-0.23607,z:0.23607},
        {x:1,y:-0.23607,z:0.23607},
        {x:-0.61804,y:0.38197,z:-0.76394},
        {x:0.61804,y:0.38197,z:-0.76394},
        {x:-0.61804,y:-0.38197,z:-0.76394},
        {x:0.61804,y:-0.38197,z:-0.76394},
        {x:-0.61804,y:0.38197,z:0.76394},
        {x:0.61804,y:0.38197,z:0.76394},
        {x:-0.61804,y:-0.38197,z:0.76394},
        {x:0.61804,y:-0.38197,z:0.76394},
        {x:-0.38197,y:0.76394,z:-0.61804},
        {x:0.38197,y:0.76394,z:-0.61804},
        {x:-0.38197,y:-0.76394,z:-0.61804},
        {x:0.38197,y:-0.76394,z:-0.61804},
        {x:-0.38197,y:0.76394,z:0.61804},
        {x:0.38197,y:0.76394,z:0.61804},
        {x:-0.38197,y:-0.76394,z:0.61804},
        {x:0.38197,y:-0.76394,z:0.61804},
        {x:-0.76394,y:0.61804,z:-0.38197},
        {x:0.76394,y:0.61804,z:-0.38197},
        {x:-0.76394,y:-0.61804,z:-0.38197},
        {x:0.76394,y:-0.61804,z:-0.38197},
        {x:-0.76394,y:0.61804,z:0.38197},
        {x:0.76394,y:0.61804,z:0.38197},
        {x:-0.76394,y:-0.61804,z:0.38197},
        {x:0.76394,y:-0.61804,z:0.38197},
        {x:-0.85411,y:0,z:-0.61804},
        {x:0.85411,y:0,z:-0.61804},
        {x:-0.85411,y:0,z:0.61804},
        {x:0.85411,y:0,z:0.61804},
        {x:0,y:0.61804,z:-0.85411},
        {x:0,y:-0.61804,z:-0.85411},
        {x:0,y:0.61804,z:0.85411},
        {x:0,y:-0.61804,z:0.85411},
        {x:-0.61804,y:0.85411,z:0},
        {x:0.61804,y:0.85411,z:0},
        {x:-0.61804,y:-0.85411,z:0},
        {x:0.61804,y:-0.85411,z:0},
    ],
    triData:[
        {v1:12,v2:8,v3:56},
        {v1:9,v2:13,v3:57},
        {v1:37,v2:36,v3:54},
        {v1:52,v2:32,v3:33},
        {v1:44,v2:56,v3:40},
        {v1:40,v2:32,v3:24},
        {v1:41,v2:57,v3:45},
        {v1:29,v2:45,v3:37},
        {v1:5,v2:54,v3:4},
        {v1:28,v2:36,v3:44},
        {v1:30,v2:6,v3:50},
        {v1:51,v2:29,v3:5},
        {v1:50,v2:20,v3:22},
        {v1:18,v2:16,v3:48},
        {v1:58,v2:46,v3:42},
        {v1:48,v2:24,v3:0},
        {v1:25,v2:33,v3:41},
        {v1:55,v2:7,v3:6},
        {v1:38,v2:30,v3:46},
        {v1:39,v2:55,v3:38},
        {v1:47,v2:31,v3:39},
        {v1:23,v2:21,v3:51},
        {v1:14,v2:58,v3:10},
        {v1:34,v2:42,v3:26},
        {v1:19,v2:49,v3:17},
        {v1:1,v2:25,v3:49},
        {v1:59,v2:43,v3:47},
        {v1:0,v2:52,v3:1},
        {v1:53,v2:2,v3:3},
        {v1:35,v2:27,v3:43},
        {v1:34,v2:53,v3:35},
        {v1:11,v2:59,v3:15},
    ],
    quaData:[
        {v1:13,v2:9,v3:8,v4:12},
        {v1:45,v2:57,v3:13,v4:37},
        {v1:36,v2:12,v3:56,v4:44},
        {v1:40,v2:56,v3:8,v4:32},
        {v1:33,v2:9,v3:57,v4:41},
        {v1:37,v2:13,v3:12,v4:36},
        {v1:32,v2:8,v3:9,v4:33},
        {v1:20,v2:44,v3:40,v4:16},
        {v1:48,v2:16,v3:40,v4:24},
        {v1:24,v2:32,v3:52,v4:0},
        {v1:1,v2:52,v3:33,v4:25},
        {v1:17,v2:41,v3:45,v4:21},
        {v1:5,v2:29,v3:37,v4:54},
        {v1:4,v2:54,v3:36,v4:28},
        {v1:50,v2:28,v3:44,v4:20},
        {v1:6,v2:4,v3:28,v4:50},
        {v1:7,v2:5,v3:4,v4:6},
        {v1:51,v2:5,v3:7,v4:31},
        {v1:51,v2:21,v3:45,v4:29},
        {v1:30,v2:50,v3:22,v4:46},
        {v1:22,v2:20,v3:16,v4:18},
        {v1:46,v2:22,v3:18,v4:42},
        {v1:42,v2:18,v3:48,v4:26},
        {v1:26,v2:48,v3:0,v4:2},
        {v1:49,v2:25,v3:41,v4:17},
        {v1:39,v2:31,v3:7,v4:55},
        {v1:55,v2:6,v3:30,v4:38},
        {v1:14,v2:38,v3:46,v4:58},
        {v1:15,v2:39,v3:38,v4:14},
        {v1:47,v2:23,v3:51,v4:31},
        {v1:59,v2:47,v3:39,v4:15},
        {v1:10,v2:58,v3:42,v4:34},
        {v1:34,v2:26,v3:2,v4:53},
        {v1:19,v2:17,v3:21,v4:23},
        {v1:3,v2:1,v3:49,v4:27},
        {v1:43,v2:27,v3:49,v4:19},
        {v1:43,v2:19,v3:23,v4:47},
        {v1:2,v2:0,v3:1,v4:3},
        {v1:53,v2:3,v3:27,v4:35},
        {v1:10,v2:34,v3:35,v4:11},
        {v1:11,v2:35,v3:43,v4:59},
        {v1:11,v2:15,v3:14,v4:10},
    ],
};
var tentModel = {
    coordData:[
        {x:-1,y:-1,z:1},
        {x:0,y:1,z:1},
        {x:1,y:-1,z:-1},
        {x:1,y:-1,z:1},
        {x:0,y:1,z:-1},
        {x:-1,y:-1,z:-1},
    ],
    triData:[
        {v1:3,v2:1,v3:0},
        {v1:5,v2:4,v3:2},
    ],
    quaData:[
        {v1:4,v2:1,v3:3,v4:2},
        {v1:5,v2:2,v3:3,v4:0},
        {v1:5,v2:0,v3:1,v4:4},
    ],
};
var pyramidModel = {
    coordData:[
        {x:-1,y:-1,z:-1},
        {x:-1,y:-1,z:1},
        {x:0,y:1,z:0},
        {x:1,y:-1,z:-1},
        {x:1,y:-1,z:1},
    ],
    triData:[
        {v1:0,v2:2,v3:3},
        {v1:3,v2:2,v3:4},
        {v1:1,v2:2,v3:0},
        {v1:4,v2:2,v3:1},
    ],
    quaData:[
        {v1:3,v2:4,v3:1,v4:0},
    ],
};
var rampModel = {
    coordData:[
        {x:-1,y:-1,z:1},
        {x:1,y:-1,z:1},
        {x:-1,y:1,z:1},
        {x:1,y:1,z:1},
        {x:1,y:-1,z:-1},
        {x:-1,y:-1,z:-1},
    ],
    triData:[
        {v1:4,v2:3,v3:1},
        {v1:2,v2:5,v3:0},
    ],
    quaData:[
        {v1:5,v2:2,v3:3,v4:4},
        {v1:3,v2:2,v3:0,v4:1},
        {v1:4,v2:1,v3:0,v4:5},
    ],
};
var twistedCubeModel = {
    coordData:[
        {x:-1,y:-1,z:-1},
        {x:-1,y:-1,z:1},
        {x:1,y:-1,z:-1},
        {x:1,y:-1,z:1},
        {x:0,y:1,z:1},
        {x:1,y:1,z:0},
        {x:0,y:1,z:-1},
        {x:-1,y:1,z:0},
    ],
    triData:[
        {v1:2,v2:6,v3:5},
        {v1:2,v2:5,v3:3},
        {v1:3,v2:5,v3:4},
        {v1:3,v2:4,v3:1},
        {v1:1,v2:4,v3:7},
        {v1:1,v2:7,v3:0},
        {v1:0,v2:7,v3:6},
        {v1:0,v2:6,v3:2},
    ],
    quaData:[
        {v1:2,v2:3,v3:1,v4:0},
        {v1:6,v2:7,v3:4,v4:5},
    ],
};
var diamondModel = {
    coordData:[
        {x:0,y:-1,z:0},
        {x:0,y:0.5,z:-1},
        {x:0,y:0.5,z:1},
        {x:0.8660254,y:0.5,z:0.5},
        {x:0.8660254,y:0.5,z:-0.5},
        {x:-0.8660254,y:0.5,z:0.5},
        {x:-0.8660254,y:0.5,z:-0.5},
        {x:-0.4330127,y:1,z:0.25},
        {x:-0.4330127,y:1,z:-0.25},
        {x:0,y:1,z:0.5},
        {x:0.4330127,y:1,z:0.25},
        {x:0,y:1,z:-0.5},
        {x:0.4330127,y:1,z:-0.25},
    ],
    triData:[
        {v1:4,v2:3,v3:0},
        {v1:3,v2:2,v3:0},
        {v1:2,v2:5,v3:0},
        {v1:5,v2:6,v3:0},
        {v1:6,v2:1,v3:0},
        {v1:1,v2:4,v3:0},
    ],
    quaData:[
        {v1:12,v2:10,v3:3,v4:4},
        {v1:10,v2:9,v3:2,v4:3},
        {v1:9,v2:7,v3:5,v4:2},
        {v1:7,v2:8,v3:6,v4:5},
        {v1:8,v2:11,v3:1,v4:6},
        {v1:11,v2:12,v3:4,v4:1},
        {v1:10,v2:12,v3:11,v4:8},
        {v1:8,v2:7,v3:9,v4:10},
    ],
};
var signModel = {
    coordData:[
        {x:0.2,y:-1,z:0},
        {x:-0.2,y:1,z:0},
        {x:1,y:0.9,z:0},
        {x:-1,y:0.9,z:0},
        {x:1,y:0,z:0},
        {x:-0.2,y:-1,z:0},
        {x:0.2,y:1,z:0},
        {x:-1,y:0,z:0},
    ],
    triData:[],
    quaData:[
        {v1:1,v2:6,v3:0,v4:5},
        {v1:6,v2:1,v3:5,v4:0},
        {v1:3,v2:2,v3:4,v4:7},
        {v1:3,v2:7,v3:4,v4:2},
    ],
};
// excludes catModel
var fishModel = {
    needsSorting:true, // probably? idrk it was false
    coordData:[
        {x:-1,y:0.6,z:0},
        {x:-0.9,y:-0.4,z:0},
        {x:-0.7,y:0,z:-0.3},
        {x:-0.7,y:0,z:0.3},
        {x:0.1,y:0,z:-0.4},
        {x:0.1,y:0,z:0.4},
        {x:0.2,y:0.6,z:0},
        {x:-0.58,y:0.15,z:0},
        {x:1,y:0.05,z:0},
        {x:0.3,y:-0.35,z:0},
        {x:-0.5,y:-0.15,z:0},
        {x:0.5,y:0.25,z:0},
        {x:-0.2,y:0.25,z:0},
        {x:0.4,y:0,z:-0.2},
        {x:0.4,y:0,z:0.2},
    ],
    triData:[
        {v1:1,v2:0,v3:2},
        {v1:1,v2:3,v3:0},
        {v1:4,v2:6,v3:11},
        {v1:11,v2:6,v3:5},
        {v1:2,v2:0,v3:7},
        {v1:7,v2:0,v3:3},
        {v1:1,v2:2,v3:10},
        {v1:10,v2:3,v3:1},
        {v1:2,v2:7,v3:10},
        {v1:10,v2:7,v3:3},
        {v1:10,v2:7,v3:4},
        {v1:10,v2:4,v3:9},
        {v1:5,v2:7,v3:10},
        {v1:9,v2:5,v3:10},
        {v1:7,v2:12,v3:4},
        {v1:12,v2:6,v3:4},
        {v1:5,v2:6,v3:12},
        {v1:5,v2:12,v3:7},
        {v1:4,v2:11,v3:13},
        {v1:14,v2:11,v3:5},
        {v1:13,v2:11,v3:8},
        {v1:8,v2:11,v3:14},
        {v1:9,v2:4,v3:13},
        {v1:9,v2:13,v3:8},
        {v1:9,v2:8,v3:14},
        {v1:9,v2:14,v3:5},
    ],
    quaData:[],
};
var mushroomTableModel = {
    needsSorting:false, // true if you can see it from below (really bad) but if you are above halfway it's fine
    coordData:[
        {x:-0.8,y:1,z:0.8},
        {x:0.8,y:1,z:0.8},
        {x:1,y:0.65,z:1},
        {x:1,y:0.65,z:-1},
        {x:-1,y:0.65,z:-1},
        {x:-1,y:0.65,z:1},
        {x:-0.8,y:1,z:-0.8},
        {x:0.8,y:1,z:-0.8},
        {x:1,y:1,z:1},
        {x:-0.45,y:0.2,z:0.45},
        {x:-0.45,y:0.2,z:-0.45},
        {x:0.45,y:0.2,z:-0.45},
        {x:0.45,y:0.2,z:0.45},
        {x:0.6,y:-1,z:0.6},
        {x:0.6,y:-1,z:-0.6},
        {x:-0.6,y:-1,z:-0.6},
        {x:-0.6,y:-1,z:0.6},
    ],
    triData:[],
    quaData:[
        {v1:13,v2:12,v3:9,v4:16},
        {v1:16,v2:9,v3:10,v4:15},
        {v1:15,v2:10,v3:11,v4:14},
        {v1:14,v2:11,v3:12,v4:13},
        
        {v1:10,v2:4,v3:3,v4:11},
        {v1:11,v2:3,v3:2,v4:12},
        {v1:12,v2:2,v3:5,v4:9},
        {v1:9,v2:5,v3:4,v4:10},
        
        {v1:5,v2:0,v3:6,v4:4},
        {v1:2,v2:1,v3:0,v4:5},
        {v1:4,v2:6,v3:7,v4:3},
        {v1:3,v2:7,v3:1,v4:2},
        
        {v1:16,v2:15,v3:14,v4:13}, // bottom
        {v1:0,v2:1,v3:7,v4:6}, // surface
    ],
};
var octoCylinderModel = {
    coordData:[
        {x:1,y:1,z:0},
        {x:0.7071,y:1,z:0.7071},
        {x:0,y:1,z:1},
        {x:-0.7071,y:1,z:0.7071},
        {x:-1,y:1,z:0},
        {x:-0.7071,y:1,z:-0.7071},
        {x:0,y:1,z:-1},
        {x:0.7071,y:1,z:-0.7071},
        
        {x:1,y:-1,z:0},
        {x:0.7071,y:-1,z:0.7071},
        {x:0,y:-1,z:1},
        {x:-0.7071,y:-1,z:0.7071},
        {x:-1,y:-1,z:0},
        {x:-0.7071,y:-1,z:-0.7071},
        {x:0,y:-1,z:-1},
        {x:0.7071,y:-1,z:-0.7071},
    ],
    triData:[],
    quaData:[
        {v1:14,v2:6,v3:7,v4:15},
        {v1:15,v2:7,v3:0,v4:8},
        {v1:8,v2:0,v3:1,v4:9},
        {v1:9,v2:1,v3:2,v4:10},
        {v1:10,v2:2,v3:3,v4:11},
        {v1:11,v2:3,v3:4,v4:12},
        {v1:12,v2:4,v3:5,v4:13},
        {v1:13,v2:5,v3:6,v4:14},
        
        {v1:4,v2:3,v3:2,v4:5},
        {v1:5,v2:2,v3:1,v4:6},
        {v1:6,v2:1,v3:0,v4:7},
        
        {v1:15,v2:8,v3:9,v4:14},
        {v1:14,v2:9,v3:10,v4:13},
        {v1:13,v2:10,v3:11,v4:12},
    ],
};
var hexaCylinderModel = {
    coordData:[
        {x:0,y:1,z:1},
        {x:-0.866,y:1,z:0.5},
        {x:-0.866,y:1,z:-0.5},
        {x:0,y:1,z:-1},
        {x:0.866,y:1,z:-0.5},
        {x:0.866,y:1,z:0.5},
        
        {x:0,y:-1,z:1},
        {x:-0.866,y:-1,z:0.5},
        {x:-0.866,y:-1,z:-0.5},
        {x:0,y:-1,z:-1},
        {x:0.866,y:-1,z:-0.5},
        {x:0.866,y:-1,z:0.5},
    ],
    triData:[],
    quaData:[
        {v1:11,v2:5,v3:0,v4:6},
        {v1:6,v2:0,v3:1,v4:7},
        {v1:10,v2:4,v3:5,v4:11},
        {v1:7,v2:1,v3:2,v4:8},
        {v1:8,v2:2,v3:3,v4:9},
        {v1:9,v2:3,v3:4,v4:10},
        
        {v1:2,v2:1,v3:0,v4:5},
        {v1:2,v2:5,v3:4,v4:3},
        {v1:9,v2:6,v3:7,v4:8},
        {v1:9,v2:10,v3:11,v4:6},
    ],
};
var discModel = {
    coordData:[
        {x:0,y:1,z:0.85},
        {x:-0.7361,y:1,z:0.425},
        {x:-0.7361,y:1,z:-0.425},
        {x:0,y:1,z:-0.85},
        {x:0.7361,y:1,z:-0.425},
        {x:0.7361,y:1,z:0.425},
        {x:0,y:-1,z:1},
        {x:-0.866,y:-1,z:0.5},
        {x:-0.866,y:-1,z:-0.5},
        {x:0,y:-1,z:-1},
        {x:0.866,y:-1,z:-0.5},
        {x:0.866,y:-1,z:0.5},
    ],
    triData:[],
    quaData:[
        {v1:11,v2:5,v3:0,v4:6},
        {v1:6,v2:0,v3:1,v4:7},
        {v1:10,v2:4,v3:5,v4:11},
        {v1:7,v2:1,v3:2,v4:8},
        {v1:8,v2:2,v3:3,v4:9},
        {v1:9,v2:3,v3:4,v4:10},
        {v1:2,v2:1,v3:0,v4:5},
        {v1:2,v2:5,v3:4,v4:3},
        {v1:9,v2:6,v3:7,v4:8},
        {v1:9,v2:10,v3:11,v4:6},
    ],
};
var spikeyTreeTrunkModel = {
    needsSorting:true, // honestly false is fine tho
    coordData:[
        {x:0.35,y:-1,z:0.35},
        {x:-0.35,y:-1,z:0.35},
        {x:-0.35,y:-1,z:-0.35},
        {x:0.35,y:-1,z:-0.35},
        {x:0.25,y:0.2,z:0.25},
        {x:-0.25,y:0.2,z:0.25},
        {x:-0.25,y:0.2,z:-0.25},
        {x:0.25,y:0.2,z:-0.25},
        {x:0.2,y:1,z:-0.8},
        {x:1,y:0.9,z:0.3},
        {x:0.1,y:1,z:0.7},
        {x:-1,y:0.85,z:-0.5},
        {x:0,y:0.7,z:0},
    ],
    triData:[
        {v1:7,v2:8,v3:12},
        {v1:7,v2:12,v3:9},
        {v1:4,v2:9,v3:12},
        {v1:4,v2:12,v3:10},
        {v1:5,v2:10,v3:12},
        {v1:5,v2:12,v3:11},
        {v1:6,v2:11,v3:12},
        {v1:6,v2:12,v3:8},
        {v1:7,v2:8,v3:12},
        
        {v1:6,v2:8,v3:7},
        {v1:7,v2:9,v3:4},
        {v1:4,v2:10,v3:5},
        {v1:5,v2:11,v3:6},
    ],
    quaData:[
        {v1:2,v2:6,v3:7,v4:3},
        {v1:3,v2:7,v3:4,v4:0},
        {v1:0,v2:4,v3:5,v4:1},
        {v1:1,v2:5,v3:6,v4:2},
        {v1:2,v2:3,v3:0,v4:1},
    ],
};
var slabModels = [
    {
        coordData:[
            {x:0.9,y:-1,z:1},
            {x:1,y:-1,z:-1},
            {x:-0.95,y:-1,z:-1},
            {x:-0.9,y:-1,z:0.95},
            {x:-1,y:0.97,z:1},
            {x:-1,y:1,z:-1},
            {x:1,y:0.95,z:-0.85},
            {x:1,y:0.75,z:1},
            {x:1,y:1,z:0.85},
            {x:0.7,y:1,z:1},
            {x:0.85,y:0.95,z:-1},
        ],
        triData:[
            {v1:7,v2:8,v3:9},
            {v1:1,v2:10,v3:6},
            {v1:1,v2:7,v3:0},
            {v1:3,v2:0,v3:4},
        ],
        quaData:[
            {v1:8,v2:5,v3:4,v4:9},
            {v1:10,v2:5,v3:8,v4:6},
            {v1:1,v2:6,v3:8,v4:7},
            {v1:2,v2:5,v3:10,v4:1},
            {v1:3,v2:4,v3:5,v4:2},
            {v1:0,v2:7,v3:9,v4:4},
            {v1:0,v2:3,v3:2,v4:1},
        ],
    },
    {
        coordData:[
            {x:0.9,y:-1,z:1},
            {x:1,y:-1,z:-1},
            {x:-0.95,y:-1,z:-1},
            {x:-0.9,y:-1,z:0.95},
            {x:-1,y:0.98,z:1},
            {x:-1,y:0.95,z:-1},
            {x:1,y:1,z:-0.85},
            {x:1,y:0.75,z:1},
            {x:1,y:0.95,z:0.85},
            {x:0.7,y:0.97,z:1},
            {x:0.85,y:1,z:-1},
        ],
        triData:[
            {v1:7,v2:8,v3:9},
            {v1:1,v2:10,v3:6},
            {v1:1,v2:7,v3:0},
            {v1:3,v2:0,v3:4},
            {v1:8,v2:5,v3:9},
            {v1:9,v2:5,v3:4},
        ],
        quaData:[
            {v1:1,v2:6,v3:8,v4:7},
            {v1:2,v2:5,v3:10,v4:1},
            {v1:3,v2:4,v3:5,v4:2},
            {v1:0,v2:7,v3:9,v4:4},
            {v1:0,v2:3,v3:2,v4:1},
            {v1:8,v2:6,v3:10,v4:5},
        ],
    },
    {
        coordData:[
            {x:-1,y:0.99,z:-0.7},
            {x:-0.85,y:-1,z:-1},
            {x:1,y:-1,z:-1},
            {x:1,y:-1,z:0.75},
            {x:1,y:1,z:1},
            {x:-1,y:1,z:1},
            {x:-1,y:-1,z:1},
            {x:1,y:0.96,z:-1},
            {x:-1,y:-1,z:-0.55},
            {x:0.75,y:-1,z:1},
            {x:-0.25,y:0.93,z:0.7},
            {x:-0.65,y:0.65,z:-1.03},
        ],
        triData:[
            {v1:0,v2:1,v3:8},
            {v1:3,v2:4,v3:9},
            {v1:0,v2:5,v3:10},
            {v1:10,v2:5,v3:4},
            {v1:0,v2:11,v3:1},
            {v1:11,v2:0,v3:7},
            {v1:0,v2:10,v3:4},
            {v1:7,v2:0,v3:4},
        ],
        quaData:[
            {v1:3,v2:2,v3:7,v4:4},
            {v1:6,v2:5,v3:0,v4:8},
            {v1:9,v2:4,v3:5,v4:6},
            {v1:9,v2:6,v3:8,v4:1},
            {v1:2,v2:3,v3:9,v4:1},
            {v1:1,v2:11,v3:7,v4:2},
        ],
    }
];
var arrowModel = {
    coordData:[
        {x:0,y:-1,z:0.5},
        {x:-0.433,y:-1,z:-0.25},
        {x:0.433,y:-1,z:-0.25},
        {x:0,y:0.3,z:0.5},
        {x:-0.433,y:0.3,z:-0.25},
        {x:0.433,y:0.3,z:-0.25},
        {x:0,y:0.3,z:1},
        {x:-0.866,y:0.3,z:0.5},
        {x:-0.866,y:0.3,z:-0.5},
        {x:0,y:0.3,z:-1},
        {x:0.866,y:0.3,z:-0.5},
        {x:0.866,y:0.3,z:0.5},
        {x:0,y:1,z:0},
    ],
    triData:[
        {v1:8,v2:9,v3:10},
        {v1:10,v2:11,v3:6},
        {v1:6,v2:7,v3:8},
        {v1:1,v2:2,v3:0},
    ],
    quaData:[
        {v1:4,v2:8,v3:10,v4:5},
        {v1:5,v2:10,v3:6,v4:3},
        {v1:3,v2:6,v3:8,v4:4},
        {v1:1,v2:4,v3:5,v4:2},
        {v1:2,v2:5,v3:3,v4:0},
        {v1:3,v2:4,v3:1,v4:0},
        {v1:10,v2:12,v3:11,v4:10},
        {v1:11,v2:12,v3:6,v4:11},
        {v1:6,v2:12,v3:7,v4:6},
        {v1:7,v2:12,v3:8,v4:7},
        {v1:8,v2:12,v3:9,v4:8},
        {v1:9,v2:12,v3:10,v4:9},
    ],
}; // the last 6 quads are actually tris, but they're quads so that can be drawn on top :D
var pianoModel = {
    needsSorting:true,
    coordData:[
        {x:-1,y:0.15,z:-0.7},
        {x:1,y:0.15,z:-0.7},
        {x:-1,y:0.15,z:1},
        {x:0.5,y:0.15,z:1},
        {x:1,y:0.15,z:0},
        {x:0.5,y:0.15,z:0.7},
        {x:0.5,y:-0.4,z:0.7},
        {x:1,y:-0.4,z:0},
        {x:0.5,y:-0.4,z:1},
        {x:-1,y:-0.4,z:1},
        {x:1,y:-0.4,z:-1},
        {x:-1,y:-0.4,z:-1},
        {x:1,y:-0.28,z:-1},
        {x:-1,y:-0.28,z:-1},
        {x:1,y:-0.28,z:-0.7},
        {x:-1,y:-0.28,z:-0.7},
        {x:0.73,y:1,z:-0.7},
        {x:0.28,y:0.78,z:1},
        {x:0.73,y:1,z:0},
        {x:0.28,y:0.78,z:0.7},
        {x:0.475,y:0.88,z:0},
        {x:0.38,y:0.83,z:0},
        {x:0.72,y:0.15,z:0},
        {x:0.85,y:0.15,z:0},
        {x:-0.7,y:-0.4,z:-0.7},
        {x:-0.7,y:-0.4,z:-0.5},
        {x:-0.5,y:-0.4,z:-0.7},
        {x:0.5,y:-0.4,z:-0.7},
        {x:0.7,y:-0.4,z:-0.5},
        {x:0.7,y:-0.4,z:-0.7},
        {x:-0.14142,y:-0.4,z:0.55858},
        {x:0,y:-0.4,z:0.7},
        {x:0.14142,y:-0.4,z:0.55858},
        {x:-0.7,y:-1,z:-0.7},
        {x:-0.7,y:-1,z:-0.5},
        {x:-0.5,y:-1,z:-0.7},
        {x:0.5,y:-1,z:-0.7},
        {x:0.7,y:-1,z:-0.5},
        {x:0.7,y:-1,z:-0.7},
        {x:-0.14142,y:-1,z:0.55858},
        {x:0,y:-1,z:0.7},
        {x:0.14142,y:-1,z:0.55858},
        // {x:-0.3,y:-0.1,z:-0.75},
        // {x:-0.3,y:0.2,z:-0.75},
        // {x:0.3,y:0.2,z:-0.75},
        // {x:0.3,y:-0.1,z:-0.75},
    ],
    triData:[],
    quaData:[
        {v1:33,v2:24,v3:26,v4:35},
        {v1:35,v2:26,v3:25,v4:34},
        {v1:34,v2:25,v3:24,v4:33},
        {v1:36,v2:27,v3:29,v4:38},
        {v1:38,v2:29,v3:28,v4:37},
        {v1:28,v2:27,v3:36,v4:37},
        {v1:30,v2:32,v3:41,v4:39},
        {v1:41,v2:32,v3:31,v4:40},
        {v1:40,v2:31,v3:30,v4:39},
        {v1:6,v2:5,v3:3,v4:8},
        {v1:0,v2:2,v3:3,v4:5},
        {v1:0,v2:5,v3:4,v4:1},
        {v1:2,v2:17,v3:19,v4:18},
        {v1:2,v2:18,v3:16,v4:0},
        {v1:2,v2:18,v3:19,v4:17},
        {v1:2,v2:0,v3:16,v4:18},
        {v1:15,v2:14,v3:12,v4:13},
        {v1:0,v2:1,v3:14,v4:15},
        {v1:10,v2:12,v3:14,v4:7},
        {v1:14,v2:1,v3:4,v4:7},
        {v1:7,v2:4,v3:5,v4:6},
        {v1:3,v2:2,v3:9,v4:8},
        {v1:9,v2:2,v3:0,v4:15},
        {v1:9,v2:15,v3:13,v4:11},
        {v1:11,v2:13,v3:12,v4:10},
        {v1:11,v2:10,v3:7,v4:6},
        {v1:8,v2:9,v3:11,v4:6},
        // {v1:42,v2:43,v3:44,v4:45},
        {v1:21,v2:20,v3:23,v4:22},
        {v1:21,v2:22,v3:23,v4:20},
    ],
};
var screenModel = {
    needsSorting:false, // false fails from below but true has sorting issue from above
    coordData:[
        {x:-0.8,y:-1.5,z:-0.35},
        {x:-0.8,y:-1.5,z:0.35},
        {x:0.8,y:-1.5,z:0.35},
        {x:0.8,y:-1.5,z:-0.35},
        {x:0.25,y:-1.15,z:0},
        {x:-0.25,y:-1.15,z:0},
        {x:-0.25,y:-1.5,z:0},
        {x:0.25,y:-1.5,z:0},
        {x:1,y:-1,z:0},
        {x:-1,y:-1,z:0},
        {x:-1,y:1,z:0},
        {x:1,y:1,z:0},
        {x:1.15,y:-1.15,z:0},
        {x:1.15,y:1.15,z:0},
        {x:-1.15,y:1.15,z:0},
        {x:-1.15,y:-1.15,z:0},
    ],
    triData:[],
    quaData:[
        {v1:0,v2:1,v3:2,v4:3}, // base
        {v1:0,v2:3,v3:2,v4:1},
        
        {v1:6,v2:5,v3:4,v4:7}, // connect
        {v1:7,v2:4,v3:5,v4:6},
        
        {v1:10,v2:14,v3:13,v4:11}, // frame
        {v1:11,v2:13,v3:12,v4:8},
        {v1:8,v2:12,v3:15,v4:9},
        {v1:9,v2:15,v3:14,v4:10},
        {v1:13,v2:14,v3:10,v4:11},
        {v1:10,v2:14,v3:15,v4:9},
        {v1:9,v2:15,v3:12,v4:8},
        {v1:12,v2:13,v3:11,v4:8},
    ],
};
var makeBagelModel = function(girth,majorRes,minorRes){
    var model = {
        needsSorting:true,
        coordData:[],
        triData:[],
        quaData:[],
    };
    for(var mang = 0; mang<minorRes; mang++){
        var rad = (1-girth)+girth*cos(mang*360/minorRes);
        var z = girth*sin(mang*360/minorRes);
        for(var ang = 0; ang<majorRes; ang++){
            model.coordData.push({x:cos(ang*360/majorRes)*rad,y:sin(ang*360/majorRes)*rad,z:z});
        }
    }
    for(var i = 0; i<minorRes; i++){
        for(var j = 0; j<majorRes; j++){
            model.quaData.push({
                v1:i*majorRes+j,
                v2:i*majorRes+(j+1)%majorRes,
                v3:((i+1)%minorRes)*majorRes+(j+1)%majorRes,
                v4:((i+1)%minorRes)*majorRes+j,
            });
        }
    }
    return(model);
};
var bagelModel;

var hookGunModel = {
    coordData:[
        {x:0.18,y:-0.6,z:-0.7},
        {x:-0.18,y:-0.6,z:-0.7},
        {x:-0.18,y:0.48,z:1},
        {x:0.18,y:0.48,z:1},
        {x:0.18,y:0,z:1},
        {x:-0.18,y:0,z:1},
        {x:-0.18,y:0,z:-1},
        {x:0.18,y:0,z:-1},
        {x:-0.18,y:0.48,z:-0.7},
        {x:-0.18,y:0,z:-0.4},
        {x:0.18,y:0,z:-0.4},
        {x:0.18,y:0.48,z:-0.7},
    ],
    triData:[],
    quaData:[
        {v1:0,v2:10,v3:9,v4:1},
        {v1:9,v2:10,v3:4,v4:5},
        {v1:1,v2:6,v3:7,v4:0},
        {v1:4,v2:3,v3:2,v4:5},
        {v1:6,v2:8,v3:11,v4:7},
        {v1:8,v2:2,v3:3,v4:11},
        {v1:0,v2:7,v3:11,v4:10},
        {v1:10,v2:11,v3:3,v4:4},
        {v1:5,v2:2,v3:8,v4:9},
        {v1:9,v2:8,v3:6,v4:1},
    ],
};

var torsoModel = {
    coordData:[
        {x:-0.54,y:1,z:0.45},
        {x:-0.54,y:1,z:-0.45},
        {x:0.54,y:1,z:-0.45},
        {x:0.54,y:1,z:0.45},
        {x:0.75,y:-1,z:0.5},
        {x:0.75,y:-1,z:-0.5},
        {x:-0.75,y:-1,z:-0.5},
        {x:-0.75,y:-1,z:0.5},
        {x:-0.65,y:-0.35,z:-0.42},
        {x:-0.65,y:-0.35,z:0.42},
        {x:0.65,y:-0.35,z:0.42},
        {x:0.65,y:-0.35,z:-0.42},
        {x:0.7,y:0.75,z:-0.5},
        {x:0.7,y:0.75,z:0.5},
        {x:-0.7,y:0.75,z:0.5},
        {x:-0.7,y:0.75,z:-0.5},
    ],
    triData:[],
    quaData:[
        {v1:6,v2:8,v3:11,v4:5},
        {v1:5,v2:11,v3:10,v4:4},
        {v1:10,v2:9,v3:7,v4:4},
        {v1:9,v2:8,v3:6,v4:7},
        {v1:12,v2:13,v3:10,v4:11},
        {v1:13,v2:14,v3:9,v4:10},
        {v1:9,v2:14,v3:15,v4:8},
        {v1:8,v2:15,v3:12,v4:11},
        {v1:15,v2:1,v3:2,v4:12},
        {v1:12,v2:2,v3:3,v4:13},
        {v1:13,v2:3,v3:0,v4:14},
        {v1:14,v2:0,v3:1,v4:15},
        {v1:1,v2:0,v3:3,v4:2},
        {v1:5,v2:4,v3:7,v4:6},
    ],
};
var armModel = {
    needsSorting:true,
    coordData:[
        {x:0.25,y:0.2,z:-0.8},
        {x:-0.25,y:0.2,z:-0.8},
        {x:-0.18,y:0.17,z:1},
        {x:0.18,y:0.17,z:1},
        {x:0.18,y:-0.23,z:1},
        {x:-0.18,y:-0.23,z:1},
        {x:-0.25,y:-0.25,z:-0.95},
        {x:0.25,y:-0.25,z:-0.95},
        {x:-0.25,y:0.15,z:-0.1},
        {x:-0.25,y:-0.3,z:-0.12},
        {x:0.25,y:-0.3,z:-0.12},
        {x:0.25,y:0.15,z:-0.1},
        {x:0.15,y:0.15,z:-1},
        {x:-0.15,y:0.15,z:-1},
    ],
    triData:[
        {v1:7,v2:12,v3:0},
        {v1:6,v2:1,v3:13},
    ],
    quaData:[
        {v1:7,v2:0,v3:11,v4:10},
        {v1:9,v2:8,v3:1,v4:6},
        {v1:3,v2:2,v3:5,v4:4},
        {v1:10,v2:11,v3:3,v4:4},
        {v1:9,v2:5,v3:2,v4:8},
        {v1:0,v2:1,v3:8,v4:11},
        {v1:6,v2:7,v3:10,v4:9},
        {v1:11,v2:8,v3:2,v4:3},
        {v1:9,v2:10,v3:4,v4:5},
        {v1:13,v2:1,v3:0,v4:12},
        {v1:6,v2:13,v3:12,v4:7},
        {v1:5,v2:4,v3:3,v4:2},
    ],
};
var leftLegModel = {
    needsSorting:true,
    coordData:[
        {x:0.25,y:-0.25,z:-1},
        {x:-0.35,y:-0.25,z:-1},
        {x:-0.21,y:-0.5,z:1},
        {x:0.17,y:-0.5,z:1},
        {x:0.22,y:0.24,z:1},
        {x:-0.22,y:0.24,z:1},
        {x:-0.35,y:0.25,z:-1},
        {x:0.25,y:0.25,z:-1},
        {x:-0.22,y:-0.19,z:-0.15},
        {x:-0.22,y:0.24,z:-0.15},
        {x:0.2,y:0.24,z:-0.15},
        {x:0.2,y:-0.19,z:-0.15},
        {x:-0.2,y:-0.06,z:0.826},
        {x:0.2,y:-0.06,z:0.826},
    ],
    triData:[
        {v1:12,v2:2,v3:5},
        {v1:13,v2:4,v3:3},
    ],
    quaData:[
        {v1:13,v2:3,v3:2,v4:12},
        {v1:8,v2:1,v3:0,v4:11},
        {v1:12,v2:8,v3:11,v4:13},
        {v1:6,v2:1,v3:8,v4:9},
        {v1:9,v2:8,v3:12,v4:5},
        {v1:4,v2:13,v3:11,v4:10},
        {v1:10,v2:11,v3:0,v4:7},
        {v1:5,v2:2,v3:3,v4:4},
        {v1:7,v2:0,v3:1,v4:6},
        {v1:10,v2:7,v3:6,v4:9},
        {v1:4,v2:10,v3:9,v4:5},
    ],
}; // right legs cannot be drawn using an inverted version of this due to face direction being flipped during reflection
var rightLegModel = {
    needsSorting:true,
    coordData:[
        {x:-0.25,y:-0.25,z:-1},
        {x:0.35,y:-0.25,z:-1},
        {x:0.21,y:-0.5,z:1},
        {x:-0.17,y:-0.5,z:1},
        {x:-0.22,y:0.24,z:1},
        {x:0.22,y:0.24,z:1},
        {x:0.35,y:0.25,z:-1},
        {x:-0.25,y:0.25,z:-1},
        {x:0.22,y:-0.19,z:-0.15},
        {x:0.22,y:0.24,z:-0.15},
        {x:-0.2,y:0.24,z:-0.15},
        {x:-0.2,y:-0.19,z:-0.15},
        {x:0.2,y:-0.06,z:0.826},
        {x:-0.2,y:-0.06,z:0.826},
    ],
    triData:[
        {v1:12,v2:5,v3:2},
        {v1:13,v2:3,v3:4},
    ],
    quaData:[
        {v1:2,v2:3,v3:13,v4:12}, // 1 foot top
        {v1:0,v2:1,v3:8,v4:11},
        {v1:11,v2:8,v3:12,v4:13},
        {v1:8,v2:1,v3:6,v4:9},
        {v1:12,v2:8,v3:9,v4:5},
        {v1:11,v2:13,v3:4,v4:10},
        {v1:0,v2:11,v3:10,v4:7},
        {v1:3,v2:2,v3:5,v4:4},
        {v1:1,v2:0,v3:7,v4:6},
        {v1:6,v2:7,v3:10,v4:9},
        {v1:9,v2:10,v3:4,v4:5},
    ],
};
var botHeadModel = {
    coordData:[
        {x:-0.5,y:1,z:0.5},
        {x:-1,y:-1,z:0.5},
        {x:-1,y:-1,z:-0.5},
        {x:-0.5,y:1,z:-0.5},
        {x:0.5,y:1,z:-0.5},
        {x:0.5,y:1,z:0.5},
        {x:0.5,y:-1,z:1},
        {x:1,y:-1,z:0.5},
        {x:1,y:-1,z:-0.5},
        {x:0.5,y:-1,z:-1},
        {x:-0.5,y:-1,z:-1},
        {x:-0.5,y:-1,z:1},
        {x:-0.5,y:0.5,z:1},
        {x:0.5,y:0.5,z:1},
        {x:1,y:0.5,z:0.5},
        {x:1,y:0.5,z:-0.5},
        {x:0.5,y:0.5,z:-1},
        {x:-0.5,y:0.5,z:-1},
        {x:-1,y:0.5,z:-0.5},
        {x:-1,y:0.5,z:0.5},
    ],
    triData:[
        {v1:16,v2:4,v3:15},
        {v1:18,v2:3,v3:17},
        {v1:14,v2:5,v3:13},
        {v1:12,v2:0,v3:19},
    ],
    quaData:[
        {v1:1,v2:19,v3:18,v4:2},
        {v1:2,v2:18,v3:17,v4:10},
        {v1:10,v2:17,v3:16,v4:9},
        {v1:9,v2:16,v3:15,v4:8},
        {v1:15,v2:14,v3:7,v4:8},
        {v1:14,v2:13,v3:6,v4:7},
        {v1:13,v2:12,v3:11,v4:6},
        {v1:12,v2:19,v3:1,v4:11},
        {v1:17,v2:3,v3:4,v4:16},
        {v1:15,v2:4,v3:5,v4:14},
        {v1:13,v2:5,v3:0,v4:12},
        {v1:19,v2:0,v3:3,v4:18},
        {v1:0,v2:5,v3:4,v4:3},
    ],
};
var agentHeadModel = {
    coordData:[
        {x:-0.5,y:1,z:0.5}, // front top
        {x:-0.7,y:-1,z:0.7},
        {x:-0.5,y:1,z:-0.5},
        {x:0.5,y:1,z:-0.5},
        {x:0.5,y:1,z:0.5}, // front top
        {x:0.7,y:-1,z:0.7},
        {x:0.7,y:-1,z:-0.7},
        {x:-0.7,y:-1,z:-0.7},
        {x:-0.5,y:0.5,z:1},
        {x:0.5,y:0.5,z:1},
        {x:1,y:0.5,z:0.5},
        {x:1,y:0.5,z:-0.5},
        {x:0.5,y:0.5,z:-1},
        {x:-0.5,y:0.5,z:-1},
        {x:-1,y:0.5,z:-0.5},
        {x:-1,y:0.5,z:0.5},
    ],
    triData:[
        {v1:12,v2:3,v3:11},
        {v1:14,v2:2,v3:13},
        {v1:10,v2:4,v3:9},
        {v1:8,v2:0,v3:15},
        {v1:12,v2:11,v3:6},
        {v1:14,v2:13,v3:7},
        {v1:10,v2:9,v3:5},
        {v1:8,v2:15,v3:1},
    ],
    quaData:[
        {v1:13,v2:2,v3:3,v4:12},
        {v1:11,v2:3,v3:4,v4:10},
        {v1:9,v2:4,v3:0,v4:8},
        {v1:15,v2:0,v3:2,v4:14},
        {v1:0,v2:4,v3:3,v4:2},
        {v1:7,v2:13,v3:12,v4:6},
        {v1:6,v2:11,v3:10,v4:5},
        {v1:9,v2:8,v3:1,v4:5},
        {v1:15,v2:14,v3:7,v4:1},
        {v1:1,v2:7,v3:6,v4:5}, // bottom
    ],
};
var monitorHeadModel = {
    coordData:[
        {x:0.5,y:0.95,z:-0.5},
        {x:0.7,y:-1,z:-0.7},
        {x:0.6,y:1,z:0.7},
        {x:-0.6,y:1,z:0.55},
        {x:-0.5,y:0.95,z:-0.5},
        {x:-0.7,y:-1,z:-0.7},
        {x:-0.65,y:-1,z:0.75},
        {x:0.65,y:-1,z:0.75},
        {x:0.5,y:0.5,z:-1},
        {x:-0.5,y:0.5,z:-1},
        {x:-0.8,y:0.2,z:-0.4},
        {x:-1,y:0.5,z:0.5},
        {x:1,y:0.5,z:0.45},
        {x:0.8,y:0.2,z:-0.4},
    ],
    triData:[
        {v1:12,v2:2,v3:3},
        {v1:11,v2:12,v3:3},
        
        {v1:6,v2:11,v3:10},
        {v1:6,v2:10,v3:5},
        {v1:7,v2:13,v3:12},
        {v1:1,v2:13,v3:7},
        {v1:13,v2:8,v3:0},
        {v1:1,v2:8,v3:13},
        {v1:10,v2:4,v3:9},
        {v1:5,v2:10,v3:9},
        
        {v1:13,v2:0,v3:12},
        {v1:12,v2:0,v3:2},
        {v1:11,v2:3,v3:4},
        {v1:11,v2:4,v3:10},
    ],
    quaData:[
        {v1:7,v2:12,v3:11,v4:6},
        {v1:3,v2:2,v3:0,v4:4},
        {v1:5,v2:1,v3:7,v4:6},
        {v1:8,v2:9,v3:4,v4:0},
        {v1:8,v2:1,v3:5,v4:9},
    ],
};
var arcadeHeadMiddleModel = {
    coordData:[
        {x:-0.25,y:-1,z:-1},
        {x:-0.25,y:-1,z:1},
        {x:1,y:-1,z:1},
        {x:1,y:-1,z:-1},
        {x:-1,y:-0.25,z:1},
        {x:-1,y:0.25,z:1},
        {x:-1,y:0.25,z:-1},
        {x:-1,y:-0.25,z:-1},
        {x:-0.25,y:1,z:-1},
        {x:-0.25,y:1,z:1},
        {x:0,y:-0.5,z:-1},
        {x:0.75,y:-0.5,z:-1},
        {x:0.75,y:-0.5,z:1},
        {x:0,y:-0.5,z:1},
        {x:0.25,y:1,z:-1},
        {x:0.25,y:1,z:1},
        {x:0,y:0.5,z:1},
        {x:0,y:0.5,z:-1},
    ],
    triData:[],
    quaData:[
        {v1:6,v2:17,v3:10,v4:7},
        {v1:17,v2:16,v3:13,v4:10},
        {v1:16,v2:5,v3:4,v4:13},
        {v1:4,v2:5,v3:6,v4:7},
    ],
};
var arcadeHeadTopModel = {
    coordData:[
        {x:-0.25,y:-1,z:-1},
        {x:-0.25,y:-1,z:1},
        {x:1,y:-1,z:1},
        {x:1,y:-1,z:-1},
        {x:-1,y:-0.25,z:1},
        {x:-1,y:0.25,z:1},
        {x:-1,y:0.25,z:-1},
        {x:-1,y:-0.25,z:-1},
        {x:-0.25,y:1,z:-1},
        {x:-0.25,y:1,z:1},
        {x:0,y:-0.5,z:-1},
        {x:0.75,y:-0.5,z:-1},
        {x:0.75,y:-0.5,z:1},
        {x:0,y:-0.5,z:1},
        {x:0.25,y:1,z:-1},
        {x:0.25,y:1,z:1},
        {x:0,y:0.5,z:1},
        {x:0,y:0.5,z:-1},
    ],
    triData:[],
    quaData:[
        {v1:17,v2:14,v3:15,v4:16},
        {v1:14,v2:8,v3:9,v4:15},
        {v1:8,v2:6,v3:5,v4:9},
        {v1:6,v2:8,v3:14,v4:17},
        {v1:15,v2:9,v3:5,v4:16},
    ],
};
var arcadeHeadBottomModel = {
    coordData:[
        {x:-0.25,y:-1,z:-1},
        {x:-0.25,y:-1,z:1},
        {x:1,y:-1,z:1},
        {x:1,y:-1,z:-1},
        {x:-1,y:-0.25,z:1},
        {x:-1,y:0.25,z:1},
        {x:-1,y:0.25,z:-1},
        {x:-1,y:-0.25,z:-1},
        {x:-0.25,y:1,z:-1},
        {x:-0.25,y:1,z:1},
        {x:0,y:-0.5,z:-1},
        {x:0.75,y:-0.5,z:-1},
        {x:0.75,y:-0.5,z:1},
        {x:0,y:-0.5,z:1},
        {x:0.25,y:1,z:-1},
        {x:0.25,y:1,z:1},
        {x:0,y:0.5,z:1},
        {x:0,y:0.5,z:-1},
    ],
    triData:[
        {v1:0,v2:11,v3:3},
        {v1:2,v2:12,v3:1},
    ],
    quaData:[
        {v1:11,v2:12,v3:2,v4:3},
        {v1:11,v2:10,v3:13,v4:12},
        {v1:0,v2:7,v3:10,v4:11},
        {v1:4,v2:1,v3:12,v4:13},
        {v1:7,v2:0,v3:1,v4:4},
        {v1:0,v2:3,v3:2,v4:1},
    ],
};

                    
/// ~~~~~~ Graphic Group Management ~~~~~ ///
                    
graphics = [];
var graphicOrders = [];
// contains structs consisting of depth dist and: tri (v1,v2,v3,col,type), qua (v1,v2,v3,v4,col,type), lin (v1,v2,r,col,type)

var getGraphicOrders = function(){
	var ar = graphics.map((g, i) => ({ depth: g.depth, id: i }));
	ar.sort((a, b) => b.depth - a.depth);


    /* lol khanacademy version:

    var ar = [];
    for(var i = 0; i<graphics.length; i++){
        ar.push({depth:graphics[i].depth,id:i});
    }
    // insertion sort
    for(var i = 1; i<ar.length; i++){
        var e = i-1;
        while(e>=0&&ar[e+1].depth>ar[e].depth){
            var swapDepth = ar[e+1].depth,
                swapId = ar[e+1].id;
            ar[e+1].depth=ar[e].depth;
            ar[e+1].id=ar[e].id;
            ar[e].depth = swapDepth;
            ar[e].id = swapId;
            
            e--;
        }
    }
    */
    
    for(var i = 0; i<ar.length; i++){
        graphicOrders[i]=ar[i].id;
    }
};

var displayGraphics = function(){
    getGraphicOrders();
    for(var i = 0; i<graphicOrders.length; i++){
        var g = graphics[graphicOrders[i]];
        if(g.needsSorting){
            var primitiveOrders = g.primitives.map((_, j) => ({
                id: j,
                depth: depth(g.primitives[j])
            }));
            primitiveOrders.sort((a, b) => b.depth - a.depth);
            /* khanacademy
            var primitiveOrders = [];
            for(var j = 0; j<g.primitives.length; j++){
                primitiveOrders.push({
                    id:j,
                    depth:depth(g.primitives[j])
                });
            }
            // insertion sort
            for(var j = 1; j<primitiveOrders.length; j++){
                var e = j-1;
                while(e>=0&&primitiveOrders[e+1].depth>primitiveOrders[e].depth){
                    var swapDepth = primitiveOrders[e+1].depth,
                        swapId = primitiveOrders[e+1].id;
                    primitiveOrders[e+1].depth=primitiveOrders[e].depth;
                    primitiveOrders[e+1].id=primitiveOrders[e].id;
                    primitiveOrders[e].depth = swapDepth;
                    primitiveOrders[e].id = swapId;
                    
                    e--;
                }
            }
            */
            for(var j = 0; j<primitiveOrders.length; j++){
                if(g.lightable){
                    calculateLightingForRenderable(g.primitives[primitiveOrders[j].id]);
                    applyLightingToRenderable(g.primitives[primitiveOrders[j].id]);
                }
                if(usingWebgl){
                    clipAndQueueToWebgl(g.primitives[primitiveOrders[j].id]);
                }
                else{
                    clipAndRender(g.primitives[primitiveOrders[j].id]);
                }
            }
        }
        else{
            for(var j = 0; j<g.primitives.length; j++){
                if(g.lightable){
                    calculateLightingForRenderable(g.primitives[j]);
                    applyLightingToRenderable(g.primitives[j]);
                }
                if(usingWebgl){
                    clipAndQueueToWebgl(g.primitives[j]);
                }
                else{
                    clipAndRender(g.primitives[j]);
                }
            }
        }
    }
    if(usingWebgl){
        renderWebglQueue();
    }
};
                    
/// ~~~~~~~~~ 3D Draw Commands ~~~~~~~~~~ ///

var minimumLinRad = 0.2, minimumDotRad = 0.25;

var drawModel = function(m,x,y,z,l,h,w,azimuth,elevation,twist,col,lightable){
    
    if(lightable===undefined){
        lightable=true;
    }
    
    // subtracting 90 to make z+ forward is accounted in other places like azimuthBetween
    
    var complexAzimuth = angToComplex(azimuth);
    var complexElevation = angToComplex(elevation);
    var complexTwist = angToComplex(twist);
    
    var processedCoordData = [];
    for(var i = 0; i<m.coordData.length; i++){
        // set and scale
        processedCoordData[i]={
            x:m.coordData[i].x*l,
            y:m.coordData[i].y*h,
            z:m.coordData[i].z*w,
        };
        //no longer needed to complexRotatePointTEA(processedCoordData[i],origin,azimuth,elevation,twist);
        
        complexRotateTwist(processedCoordData[i],complexTwist);
        complexRotateElevation(processedCoordData[i],complexElevation);
        complexRotateAzimuth(processedCoordData[i],complexAzimuth);
        processedCoordData[i].x+=x;
        processedCoordData[i].y+=y;
        processedCoordData[i].z+=z;
        complexAdjustPointForCamera(processedCoordData[i]);
    }
    
    if(col===undefined){col=[255,0,255,170+75*sin(ganime*3)];}
    var graphicGroup = {
        lightable:lightable,
        depth:-1,
        primitives:[],
    };
    if(m.needsSorting===true){graphicGroup.needsSorting=true;}
    else{graphicGroup.needsSorting=false;}
    if(m.triData!==undefined){
        for(var i = 0; i<m.triData.length; i++){
            var tri = {
                v1:pCopy(processedCoordData[m.triData[i].v1]),
                v2:pCopy(processedCoordData[m.triData[i].v2]),
                v3:pCopy(processedCoordData[m.triData[i].v3]),
                col:[col[0],col[1],col[2],col[3]],
                type:"tri"
                // no shading
            };
            if(vDotProduct(threePointNormal(tri),triCenter(tri))<0){
                if(triHasPositiveZVertex(tri)){
                    graphicGroup.primitives.push(tri);
                    var d = distOriginToTri(tri);
                    if(graphicGroup.depth===-1||d<graphicGroup.depth){
                        graphicGroup.depth=d;
                    }
                }
            }
        }
    }
    if(m.quaData!==undefined){
        for(var i = 0; i<m.quaData.length; i++){
            var qua = {
                v1:pCopy(processedCoordData[m.quaData[i].v1]),
                v2:pCopy(processedCoordData[m.quaData[i].v2]),
                v3:pCopy(processedCoordData[m.quaData[i].v3]),
                v4:pCopy(processedCoordData[m.quaData[i].v4]),
                col:[col[0],col[1],col[2],col[3]],
                type:"qua"
                // no shading
            };
            var isVisible = false;
            if(m.tryEveryQuaNormal===true){
                // for external models where they have a normal map or something to make a curved quad
                if(vDotProduct(threePointNormal(qua),qua.v1)<0){isVisible=true;}
                else if(vDotProduct(threePointNormal({v1:qua.v2,v2:qua.v3,v3:qua.v4}),qua.v1)<0){isVisible=true;}
                else if(vDotProduct(threePointNormal({v1:qua.v3,v2:qua.v4,v3:qua.v1}),qua.v1)<0){isVisible=true;}
                else if(vDotProduct(threePointNormal({v1:qua.v4,v2:qua.v1,v3:qua.v2}),qua.v1)<0){isVisible=true;}
            }
            else{
                if(vDotProduct(threePointNormal(qua),quaCenter(qua))<0){isVisible=true;}
            }
            if(isVisible){
                if(quaHasPositiveZVertex(qua)){
                    graphicGroup.primitives.push(qua);
                    var d = distOriginToQua(qua);
                    if(graphicGroup.depth===-1||d<graphicGroup.depth){
                        graphicGroup.depth=d;
                    }
                }
            }
        }
    }
    
    if(graphicGroup.primitives.length===0){return(false);}
    graphics.push(graphicGroup);
    return(true);
}; // returns boolean of if it .pushed graphic

// these four "primitive" drawers return a boolean of whether or not they pushed a graphic 
var drawTriangle = function(tri,lightable){
    if(lightable===undefined){
        lightable=true;
    }
    adjustTriForCamera(tri);
    if(triHasPositiveZVertex(tri)){
        if(vDotProduct(threePointNormal(tri),triCenter(tri))>0){
            var x = tri.v1.x;
            var y = tri.v1.y;
            var z = tri.v1.z;
            tri.v1.x=tri.v2.x;
            tri.v1.y=tri.v2.y;
            tri.v1.z=tri.v2.z;
            tri.v2.x=x;
            tri.v2.y=y;
            tri.v2.z=z;
        }
        tri.type="tri";
        graphics.push({
            lightable:lightable,
            depth:distOriginToTri(tri),
            primitives:[tri]
        });
    }
};
var drawQuad = function(qua,lightable){
    if(lightable===undefined){
        lightable=true;
    }
    adjustQuaForCamera(qua);
    if(quaHasPositiveZVertex(qua)){
        if(vDotProduct(threePointNormal(qua),triCenter(qua))>0){
            var x = qua.v1.x;
            var y = qua.v1.y;
            var z = qua.v1.z;
            qua.v1.x=qua.v3.x;
            qua.v1.y=qua.v3.y;
            qua.v1.z=qua.v3.z;
            qua.v3.x=x;
            qua.v3.y=y;
            qua.v3.z=z;
        }
        qua.type="qua";
        graphics.push({
            lightable:lightable,
            depth:distOriginToQua(qua),
            primitives:[qua]
        });
        return(true);
    }
    return(false);
}; // BEWARE: THINGS ARE BEING MODIFIED BY REFERENCE :D
var drawDot = function(dot){
    var lightable = false; // DONT MAKE IT TRUE IT CRASHES -12/1/24
    complexAdjustPointForCamera(dot);
    
    // consider it adjusting radius for camera
    dot.rad*=c.zoomScaleX*c.zoom/vLength(dot);
    // this is not a good way to do it lol. to be more realistic, calculate the average 2d distance to a point that would be on the furthest bit of the sphere with the same radius. but nobody cares because these are supposed to be small and cheap and not clip-necessary. this is also why i'm also doing culling smols:
    if(dot.z>0&&dot.rad>minimumDotRad){
        dot.type="dot";
        graphics.push({
            lightable:lightable,
            depth:vLength(dot),
            primitives:[dot]
        });
        return(true);
    }
    return(false);
}; // drawDot({x,y,z,rad,renderType,renderRotation,col})
var drawLine = function(lin,lightable){
    if(lightable===undefined){
        lightable=true;
    }
    complexAdjustPointForCamera(lin.v1);
    complexAdjustPointForCamera(lin.v2);
    
    // consider it adjusting radius for camera
    lin.rad*=c.zoomScaleX*c.zoom/vLength(midPoint(lin.v1,lin.v2));
   
    if((lin.v1.z>0||lin.v2.z)&&lin.rad>minimumLinRad){
        lin.type="lin";
        graphics.push({
            lightable:lightable,
            depth:distPointToLineSegment(lin.v1,lin.v2,origin),
            primitives:[lin]
        });
        return(true);
    }
    return(false);
}; // drawLine({v1:{x,y,z},v2:{x,y,z},rad,col},false)

var drawFloor = function(y,col,lightable){
    if(lightable===undefined){
        lightable=false;
    }
    var qua = {
        v1:{x:c.x-1e10*(c.y-y),y:y,z:c.z+1e10*(c.y-y)},
        v2:{x:c.x+1e10*(c.y-y),y:y,z:c.z+1e10*(c.y-y)},
        v3:{x:c.x+1e10*(c.y-y),y:y,z:c.z-1e10*(c.y-y)},
        v4:{x:c.x-1e10*(c.y-y),y:y,z:c.z-1e10*(c.y-y)},
        col:col,
    };
    adjustQuaForCamera(qua);
    if(quaHasPositiveZVertex(qua)){
        qua.type="qua";
        graphics.push({
            lightable:lightable,
            //depth:32767*(c.y-y)+distPointToPlane(quaCenter(qua),threePointNormal(qua),origin),
            depth:1e12,
            primitives:[qua]
        });
    }
};

var drawCube = function(x,y,z,s,azimuth,elevation,twist,col,lightable){
    
    if(lightable===undefined){
        lightable=true;
    }
    
    var complexAzimuth = angToComplex(azimuth);
    var complexElevation = angToComplex(elevation);
    var complexTwist = angToComplex(twist);
    
    var processedCoordData = [];
    for(var i = 0; i<cubeModel.coordData.length; i++){
        processedCoordData[i]=vScale(cubeModel.coordData[i],s);
        //no longer needed to complexRotatePointTEA(processedCoordData[i],origin,azimuth,elevation,twist);
        
        complexRotateTwist(processedCoordData[i],complexTwist);
        complexRotateElevation(processedCoordData[i],complexElevation);
        complexRotateAzimuth(processedCoordData[i],complexAzimuth);
        processedCoordData[i].x+=x;
        processedCoordData[i].y+=y;
        processedCoordData[i].z+=z;
        complexAdjustPointForCamera(processedCoordData[i]);
    }
    
    if(col===undefined){col=[255,0,255,170+75*sin(ganime*3)];}
    var graphicGroup = {
        lightable:lightable,
        depth:-1,
        primitives:[]
    };
    var closestFaceId = -1;
    var closestFaceEdst = -1;
    var onId = 0;
    for(var i = 0; i<cubeModel.quaData.length; i++){
        var qua = {
            v1:pCopy(processedCoordData[cubeModel.quaData[i].v1]),
            v2:pCopy(processedCoordData[cubeModel.quaData[i].v2]),
            v3:pCopy(processedCoordData[cubeModel.quaData[i].v3]),
            v4:pCopy(processedCoordData[cubeModel.quaData[i].v4]),
            col:[col[0],col[1],col[2],col[3]],
            type:"qua"
            // no shading
        };
        if(vDotProduct(threePointNormal(qua),quaCenter(qua))<0){
            if(quaHasPositiveZVertex(qua)){
                graphicGroup.primitives.push(qua);
                var edst = vLength(quaCenter(qua));
                if(closestFaceEdst===-1||edst<closestFaceEdst){
                    closestFaceEdst=edst;
                    closestFaceId = onId;
                }
                onId++;
            }
        }
    }
    if(graphicGroup.primitives.length){
        if(closestFaceId===-1){console.log("no face on a cube claimed closest to calculate depth for cube");return;}
        graphicGroup.depth=distOriginToQua(graphicGroup.primitives[closestFaceId]);
        graphics.push(graphicGroup);
    }
};

var drawStar = function(star,brightness,lightable){
    // star is just an xyz thing.
    if(lightable===undefined){
        lightable=false;
    }
    if(brightness===undefined){
        brightness=1;
    }
    star.renderType = "square";
    star.renderRotation = star.y%360+ganime; // effectively random but consistent
    complexAdjustPointForCamera(star);
    
    // consider it adjusting radius for camera
    star.rad=100*c.zoomScaleX*c.zoom/vLength(star);
    star.col=[255*brightness,255*brightness,255*brightness];
    if(star.z>0&&star.rad>0.3){
        star.type="dot";
        graphics.push({
            lightable:lightable,
            depth:1e13+vLength(star),
            primitives:[star]
        });
    }
    
    /*
    var stars = [];
    for(var i = 0; i<200; i++){
        stars.push({x:0,y:0,z:random(10000,25000)});
        angRotatePointTEA(stars[i],origin,random(0,360),random(0,acos(random(0,0.99999))),0);
    }
    */
};

var drawSun = function(dst,rad,sideCount,azimuth,elevation,twist,col,lightable){
    if(lightable===undefined){
        lightable=false;
    }
    var vertices = [];
    var center = {x:0,y:0,z:dst};
    angRotatePointTEA(center,origin,azimuth,elevation,twist);
    for(var i = 0; i<sideCount; i++){
        vertices.push({x:rad*cos(360*i/sideCount),y:rad*sin(360*i/sideCount),z:dst});
        angRotatePointTEA(vertices[vertices.length-1],origin,azimuth,elevation,twist);
    }
    for(var i = 0; i+2<=sideCount; i+=2){
        var j = (i+1)%sideCount;
        var k = (i+2)%sideCount;
        if(drawQuad({v1:pCopy(vertices[i]),v2:pCopy(vertices[j]),v3:pCopy(vertices[k]),v4:pCopy(center),col:col},lightable)){graphics[graphics.length-1].depth=1e13+dst;}
    }
    
    // for(var i = 0; i<sideCount; i++){
    //     drawDot({x:vertices[i].x,y:vertices[i].y,z:vertices[i].z,rad:rad/30,renderType:"circle",col:[100,0,0]});
    // }
    // drawDot({x:center.x,y:center.y,z:center.z,rad:rad/30,renderType:"circle",col:[0,0,100]});
};

var drawLattice = function(surfaceHeight,width,spacing,lineWidth,col,lightable){
    if(lightable===undefined){lightable=true;}
    for(var i = -spacing*width-anyModulo(c.z,spacing); i<spacing*width+1-anyModulo(c.z,spacing); i+=spacing){
        var len = width*spacing/2*sin(acos(i/width/spacing*2));
        var qua = {
            v1:{x:c.x-len,y:surfaceHeight,z:c.z+i-lineWidth},
            v2:{x:c.x-len,y:surfaceHeight,z:c.z+i+lineWidth},
            v3:{x:c.x+len,y:surfaceHeight,z:c.z+i+lineWidth},
            v4:{x:c.x+len,y:surfaceHeight,z:c.z+i-lineWidth},
            col:col
        };
        adjustQuaForCamera(qua);
        if(quaHasPositiveZVertex(qua)){
            qua.type="qua";
            graphics.push({
                lightable:lightable,
                depth:1e11,
                primitives:[qua]
            });
        }
    }
    for(var i = -spacing*width-anyModulo(c.x,spacing); i<spacing*width+1-anyModulo(c.x,spacing); i+=spacing){
        var len = width*spacing/2*sin(acos(i/width/spacing*2));
        var qua = {
            v1:{x:c.x+i-lineWidth,y:surfaceHeight,z:c.z-len},
            v2:{x:c.x+i-lineWidth,y:surfaceHeight,z:c.z+len},
            v3:{x:c.x+i+lineWidth,y:surfaceHeight,z:c.z+len},
            v4:{x:c.x+i+lineWidth,y:surfaceHeight,z:c.z-len},
            col:col
        };
        adjustQuaForCamera(qua);
        if(quaHasPositiveZVertex(qua)){
            qua.type="qua";
            graphics.push({
                lightable:lightable,
                depth:1e11,
                primitives:[qua]
            });
        }
    }
};

var drawGameBar = function(x,y,z,width,fraction,col,lightable){
    if(col===undefined){
        col = [map(pow(constrain(1.1-fraction*1.15,0,1),0.25),0,1,0,255),map(pow(fraction,0.35),0,1,0,255),0];
    }
    if(lightable===undefined){lightable=false;}
    var pts = [
        {x:x-(2*fraction-1)*width,y:y-0.13,z:z},
        {x:x+width,y:y-0.12,z:z},
        {x:x+width,y:y+0.12,z:z},
        {x:x-(2*fraction-1)*width,y:y+0.13,z:z},
        {x:x-width-0.04,y:y-0.16,z:z},
        {x:x+width+0.04,y:y-0.16,z:z},
        {x:x+width+0.04,y:y+0.16,z:z},
        {x:x-width-0.04,y:y+0.16,z:z},
    ];
    var barCenter = {x:x,y:y,z:z};
    for(var i = 0; i<pts.length; i++){
        angRotatePointTEA(pts[i],barCenter,azimuthBetween(barCenter,c),elevationBetween(barCenter,c),0);
    }
    
    var d1;
    if(drawQuad({v1:pts[4],v2:pts[5],v3:pts[6],v4:pts[7],col:[50,50,50]},lightable)){graphics[graphics.length-1].depth-=1;d1=graphics[graphics.length-1].depth;}
    if(drawQuad({v1:pts[0],v2:pts[1],v3:pts[2],v4:pts[3],col:col},lightable)){graphics[graphics.length-1].depth=d1-0.0001;}
};



// body rotation is anchored around base point. rotation around center of mass would have to be done manually. this is also kinda true for head (manually made to look like the point is the neck rather than the center eye)
var angGenerateBodyFrame = function(
    x,y,z,
    azimuth,elevation,twist,headAzimuth,headElevation,
    neckLength,shoulderSpan,armLength,crotchDrop,hipSpan,legLength,
    leftElbowAzimuth,leftElbowElevation,leftHandAzimuth,leftHandElevation,
    rightElbowAzimuth,rightElbowElevation,rightHandAzimuth,rightHandElevation,
    leftKneeAzimuth,leftKneeElevation,leftFootAzimuth,leftFootElevation,
    rightKneeAzimuth,rightKneeElevation,rightFootAzimuth,rightFootElevation
){
    /*headElevation = anyModulo(headElevation,180);
    if(headElevation===90){headElevation+=0.001;} this causes glitches for some reason*/
    if(anyModulo(headElevation,180)===90){headElevation+=0.001;}
    if(!rightHandAzimuth){rightHandAzimuth=0.0001;}
    if(!leftHandAzimuth){leftHandAzimuth=0.0001;}
    if(!rightFootAzimuth){rightFootAzimuth=0.0001;} //
    if(!leftFootAzimuth){leftFootAzimuth=0.0001;}
    if(rightFootElevation>-0.001){rightFootElevation=-0.001;}
    if(leftFootElevation>-0.001){leftFootElevation=-0.001;}
    if(!rightHandElevation){rightHandElevation=0.0001;}
    if(!leftHandElevation){leftHandElevation=0.0001;}
    if(!rightKneeElevation){rightKneeElevation=0.0001;}
    if(!leftKneeElevation){leftKneeElevation=0.0001;}
    var root = {x:x,y:y,z:z};
    var eye = {x:x,y:y-0.001*abs(headElevation),z:z-sin(headElevation)*0.25}; // adjust for how the head 
    var neckBase = {x:x,y:y-neckLength,z:z};
    var leftShoulder = {x:x-shoulderSpan/2,y:y-neckLength,z:z};
    var rightShoulder = {x:x+shoulderSpan/2,y:y-neckLength,z:z};
    var leftElbow = {x:x-shoulderSpan/2,y:y-neckLength-armLength/2,z:z};
    var rightElbow = {x:x+shoulderSpan/2,y:y-neckLength-armLength/2,z:z};
    var leftHand = {x:x-shoulderSpan/2,y:y-neckLength-armLength,z:z};
    var rightHand = {x:x+shoulderSpan/2,y:y-neckLength-armLength,z:z};
    var crotchPoint = {x:x,y:y-crotchDrop,z:z};
    var leftHip = {x:x-hipSpan/2,y:y-crotchDrop*1.1,z:z};
    var rightHip = {x:x+hipSpan/2,y:y-crotchDrop*1.1,z:z};
    var leftKnee = {x:leftHip.x,y:leftHip.y-legLength/2,z:z};
    var rightKnee = {x:rightHip.x,y:rightHip.y-legLength/2,z:z};
    var leftFoot = {x:leftHip.x,y:leftHip.y-legLength,z:z};
    var rightFoot = {x:rightHip.x,y:rightHip.y-legLength,z:z};
    
    var clea = angToComplex(leftElbowAzimuth);
    var clee = angToComplex(leftElbowElevation);
    var crea = angToComplex(rightElbowAzimuth);
    var cree = angToComplex(rightElbowElevation);
    var clka = angToComplex(leftKneeAzimuth);
    var clke = angToComplex(leftKneeElevation);
    var crka = angToComplex(rightKneeAzimuth);
    var crke = angToComplex(rightKneeElevation);
    
    complexRotatePointTEA(leftElbow,leftShoulder,clea,clee,complexOne);
    complexRotatePointTEA(leftHand,leftShoulder,clea,clee,complexOne);
    angRotatePointTEA(leftHand,leftElbow,leftHandAzimuth,leftHandElevation,0);
    complexRotatePointTEA(rightElbow,rightShoulder,crea,cree,complexOne);
    complexRotatePointTEA(rightHand,rightShoulder,crea,cree,complexOne);
    angRotatePointTEA(rightHand,rightElbow,rightHandAzimuth,rightHandElevation,0);
    complexRotatePointTEA(leftKnee,leftHip,clka,clke,complexOne);
    complexRotatePointTEA(leftFoot,leftHip,clka,clke,complexOne);
    angRotatePointTEA(leftFoot,leftKnee,leftFootAzimuth,leftFootElevation,0);
    complexRotatePointTEA(rightKnee,rightHip,crka,crke,complexOne);
    complexRotatePointTEA(rightFoot,rightHip,crka,crke,complexOne);
    angRotatePointTEA(rightFoot,rightKnee,rightFootAzimuth,rightFootElevation,0);
    
    var facingFocus = angsToVector(headAzimuth,headElevation);
    facingFocus = vAdd(facingFocus,eye);
    
    var frame = {
        azimuth:azimuth,
        elevation:elevation,
        twist:twist,
        facingFocus:facingFocus,
        root:root,
        eye:eye,
        neckBase:neckBase,
        leftShoulder:leftShoulder,
        rightShoulder:rightShoulder,
        leftElbow:leftElbow,
        rightElbow:rightElbow,
        leftHand:leftHand,
        rightHand:rightHand,
        crotchPoint:crotchPoint,
        leftHip:leftHip,
        rightHip:rightHip,
        leftKnee:leftKnee,
        rightKnee:rightKnee,
        leftFoot:leftFoot,
        rightFoot:rightFoot,
    };
    
    var basePoint = {x:x,y:y-crotchDrop*1.1-legLength,z:z};
    var ca = angToComplex(azimuth);
    var ce = angToComplex(elevation);
    var ct = angToComplex(twist);
    for(var i in frame){
        complexRotatePointTEA(frame[i],basePoint,ca,ce,ct);
    }
    
    return(frame);
};
// slightly higher level than angGenerateBodyFrame
var argsGenerateBodyFrame = function(x,y,z,sizeArgs,uArgs,lArgs){
    return angGenerateBodyFrame(
        x,y,z,
        uArgs[8],uArgs[9],uArgs[10],   uArgs[11],uArgs[12],
        sizeArgs[0],sizeArgs[1],sizeArgs[2],sizeArgs[3],sizeArgs[4],sizeArgs[5],
        uArgs[0],uArgs[1],uArgs[2],uArgs[3],
        uArgs[4],uArgs[5],uArgs[6],uArgs[7],
        lArgs[0],lArgs[1],lArgs[2],lArgs[3],
        lArgs[4],lArgs[5],lArgs[6],lArgs[7]
    );
};

var drawBodyFrame = function(bodyFrame){
    var counter = 0;
    for(var i in bodyFrame){
        if(typeof(bodyFrame[i])==="object"){
            drawCube(bodyFrame[i].x,bodyFrame[i].y,bodyFrame[i].z,0.02+0.03*(counter>0),0,0,0,[255*(!counter),255,255*(!counter)],false); //graphics[graphics.length-1].depth--;
            counter++;
        }
    }
};

// drawArm and drawLeg do not handle special cases with collinear key points. this is handled when generating body frames. for whatever reason. on top of midjoint elevation for both, arms require nonzero hand azimuth, and legs require nonzero foot elevation.
var drawArm = function(shoulder,elbow,hand,col,lightable){
    
    var armLength = distPointToPoint(shoulder,elbow)*2.1; // stretched out length
    var ghostHand = vAdd(elbow,vSub(elbow,shoulder)); // where the hand would be if the arm was straight
    var x = (shoulder.x+ghostHand.x)/2;
    var y = (shoulder.y+ghostHand.y)/2;
    var z = (shoulder.z+ghostHand.z)/2;
    
    var azimuth = azimuthBetween(shoulder,ghostHand);
    var elevation = elevationBetween(shoulder,ghostHand);
    // currently the elbow cannot bend the ghost hand into place because the arm lifts directly upward. it needs twist so the elbow's plane of rotation can move the ghost hand onto the real hand. this twist is the angle between those two planes, or the two unit vectors: the first default one pointing in the direction of shoulder->elbow azimuth, shoulder->elbow+90 elevation; the second final one pointing from the closest point on the line of shoulder and elbow to the real hand, to the real hand.
    var defaultAuxVec=angsToVector(azimuth,elevation+90);
    var finalAuxVec=lineToPointNormal(shoulder,elbow,hand); // warning: not normalized
    
    var twist=angBetweenVectors(defaultAuxVec,finalAuxVec);
    if(pointStrictSideOfPlane(elbow,vNormalize(angsToVector(azimuth-90,0)),hand)){
        twist*=-1;
        // neg/pos is lost during vector conversion, so if hand is on the outer side of body (relaxed, front lifting position) this artificially restores that.
    }
    
    if(lightable===undefined){
        lightable=true;
    }
    
    var complexAzimuth = angToComplex(azimuth);
    var complexElevation = angToComplex(elevation);
    var complexTwist = angToComplex(twist);
    
    var processedCoordData = [];
    for(var i = 0; i<armModel.coordData.length; i++){
        // set and scale
        processedCoordData[i]={
            x:armModel.coordData[i].x*armLength*0.35, // 0.35, 0.35, and 0.5 should not be changed
            y:armModel.coordData[i].y*armLength*0.35,
            z:armModel.coordData[i].z*armLength*0.5,
        };
    }
    
    /* ...if i remember correctly, this is where we move vertices to the actual hand, and readjust elbow somehow
    [2] = front left hand vertex from forward birds eye view of model with forward lifting arms
    [3] = front right
    [4] = back right
    [5] = back left */
    var elbowChangeAngle = angBetweenVectors(vSub(ghostHand,elbow),vSub(hand,elbow)); // elevation change needed
    var fullComplexECA = angToComplex(elbowChangeAngle);
    var halfComplexECA = angToComplex(elbowChangeAngle/2);
    // elbow of arm at default orientation should be the origin (can be reached by "undoing" the final transformations, but that would be kinda unnecessary)
    for(var i = 2; i<6; i++){
        complexRotateElevation(processedCoordData[i],fullComplexECA);
    }
    for(var i = 8; i<12; i++){
        complexRotateElevation(processedCoordData[i],halfComplexECA);
    }
    
    
    for(var i = 0; i<armModel.coordData.length; i++){
        complexRotateTwist(processedCoordData[i],complexTwist);
        complexRotateElevation(processedCoordData[i],complexElevation);
        complexRotateAzimuth(processedCoordData[i],complexAzimuth);
        processedCoordData[i].x+=x;
        processedCoordData[i].y+=y;
        processedCoordData[i].z+=z;
        
        complexAdjustPointForCamera(processedCoordData[i]);
    }
    
    if(col===undefined){col=[255,0,255,170+75*sin(ganime*3)];}
    var graphicGroup = {
        lightable:lightable,
        depth:-1,
        primitives:[],
    };
    if(armModel.needsSorting===true){graphicGroup.needsSorting=true;}
    else{graphicGroup.needsSorting=false;}
    if(armModel.triData!==undefined){
        for(var i = 0; i<armModel.triData.length; i++){
            var tri = {
                v1:pCopy(processedCoordData[armModel.triData[i].v1]),
                v2:pCopy(processedCoordData[armModel.triData[i].v2]),
                v3:pCopy(processedCoordData[armModel.triData[i].v3]),
                col:[col[0],col[1],col[2],col[3]],
                type:"tri"
                // no shading
            };
            if(vDotProduct(threePointNormal(tri),triCenter(tri))<0){
                if(triHasPositiveZVertex(tri)){
                    graphicGroup.primitives.push(tri);
                    var d = distOriginToTri(tri);
                    if(graphicGroup.depth===-1||d<graphicGroup.depth){
                        graphicGroup.depth=d;
                    }
                }
            }
        }
    }
    if(armModel.quaData!==undefined){
        for(var i = 0; i<armModel.quaData.length; i++){
            var qua = {
                v1:pCopy(processedCoordData[armModel.quaData[i].v1]),
                v2:pCopy(processedCoordData[armModel.quaData[i].v2]),
                v3:pCopy(processedCoordData[armModel.quaData[i].v3]),
                v4:pCopy(processedCoordData[armModel.quaData[i].v4]),
                col:[col[0],col[1],col[2],col[3]],
                type:"qua"
                // no shading
            };
            var isVisible = false;
            if(armModel.tryEveryQuaNormal===true){
                // for external models where they have a normal map or something to make a curved quad
                if(vDotProduct(threePointNormal(qua),qua.v1)<0){isVisible=true;}
                else if(vDotProduct(threePointNormal({v1:qua.v2,v2:qua.v3,v3:qua.v4}),qua.v1)<0){isVisible=true;}
                else if(vDotProduct(threePointNormal({v1:qua.v3,v2:qua.v4,v3:qua.v1}),qua.v1)<0){isVisible=true;}
                else if(vDotProduct(threePointNormal({v1:qua.v4,v2:qua.v1,v3:qua.v2}),qua.v1)<0){isVisible=true;}
            }
            else{
                if(vDotProduct(threePointNormal(qua),quaCenter(qua))<0){isVisible=true;}
            }
            if(isVisible){
                if(quaHasPositiveZVertex(qua)){
                    graphicGroup.primitives.push(qua);
                    var d = distOriginToQua(qua);
                    if(graphicGroup.depth===-1||d<graphicGroup.depth){
                        graphicGroup.depth=d;
                    }
                }
            }
        }
    }
    
    if(graphicGroup.primitives.length===0){return(false);}
    graphics.push(graphicGroup);
    return(true);
}; // arm that can bend
var drawLeg = function(hip,knee,foot,rightSide,col,lightable){
    
    var thisLegModel;
    if(rightSide){thisLegModel=rightLegModel;}
    else{thisLegModel=leftLegModel;}
    // basically the same as drawArm function. see comments there for explanation
    
    var legLength = distPointToPoint(hip,knee)*2.1;
    var ghostFoot = vAdd(knee,vSub(knee,hip));
    var x = (hip.x+ghostFoot.x)/2;
    var y = (hip.y+ghostFoot.y)/2;
    var z = (hip.z+ghostFoot.z)/2;
    
    var azimuth = azimuthBetween(hip,ghostFoot);
    var elevation = elevationBetween(hip,ghostFoot);
    var defaultAuxVec=angsToVector(azimuth,elevation+90);
    var finalAuxVec=lineToPointNormal(hip,knee,foot);
    
    var twist=angBetweenVectors(defaultAuxVec,finalAuxVec);
    if(pointStrictSideOfPlane(knee,vNormalize(angsToVector(azimuth-90,0)),foot)){
        twist*=-1;
    }
    
    if(lightable===undefined){
        lightable=true;
    }
    
    var complexAzimuth = angToComplex(azimuth);
    var complexElevation = angToComplex(elevation);
    var complexTwist = angToComplex(twist);
    
    var processedCoordData = [];
    for(var i = 0; i<thisLegModel.coordData.length; i++){
        processedCoordData[i]={
            x:thisLegModel.coordData[i].x*legLength*0.35,
            y:thisLegModel.coordData[i].y*legLength*0.35,
            z:thisLegModel.coordData[i].z*legLength*0.5,
        };
    }
    
    var kneeChangeAngle = angBetweenVectors(vSub(ghostFoot,knee),vSub(foot,knee));
    var fullComplexECA = angToComplex(kneeChangeAngle);
    var halfComplexECA = angToComplex(kneeChangeAngle/2);
    for(var i = 2; i<6; i++){
        complexRotateElevation(processedCoordData[i],fullComplexECA);
    }
    for(var i = 8; i<12; i++){
        complexRotateElevation(processedCoordData[i],halfComplexECA);
    }
    complexRotateElevation(processedCoordData[12],fullComplexECA);
    complexRotateElevation(processedCoordData[13],fullComplexECA);
    
    
    for(var i = 0; i<thisLegModel.coordData.length; i++){
        complexRotateTwist(processedCoordData[i],complexTwist);
        complexRotateElevation(processedCoordData[i],complexElevation);
        complexRotateAzimuth(processedCoordData[i],complexAzimuth);
        processedCoordData[i].x+=x;
        processedCoordData[i].y+=y;
        processedCoordData[i].z+=z;
        
        complexAdjustPointForCamera(processedCoordData[i]);
    }
    
    if(col===undefined){col=[255,0,255,170+75*sin(ganime*3)];}
    var graphicGroup = {
        lightable:lightable,
        depth:-1,
        primitives:[],
    };
    if(thisLegModel.needsSorting===true){graphicGroup.needsSorting=true;}
    else{graphicGroup.needsSorting=false;}
    if(thisLegModel.triData!==undefined){
        for(var i = 0; i<thisLegModel.triData.length; i++){
            var tri = {
                v1:pCopy(processedCoordData[thisLegModel.triData[i].v1]),
                v2:pCopy(processedCoordData[thisLegModel.triData[i].v2]),
                v3:pCopy(processedCoordData[thisLegModel.triData[i].v3]),
                col:[col[0],col[1],col[2],col[3]],
                type:"tri"
            };
            if(vDotProduct(threePointNormal(tri),triCenter(tri))<0){
                if(triHasPositiveZVertex(tri)){
                    graphicGroup.primitives.push(tri);
                    var d = distOriginToTri(tri);
                    if(graphicGroup.depth===-1||d<graphicGroup.depth){
                        graphicGroup.depth=d;
                    }
                }
            }
        }
    }
    if(thisLegModel.quaData!==undefined){
        for(var i = 0; i<thisLegModel.quaData.length; i++){
            var qua = {
                v1:pCopy(processedCoordData[thisLegModel.quaData[i].v1]),
                v2:pCopy(processedCoordData[thisLegModel.quaData[i].v2]),
                v3:pCopy(processedCoordData[thisLegModel.quaData[i].v3]),
                v4:pCopy(processedCoordData[thisLegModel.quaData[i].v4]),
                col:[col[0],col[1],col[2],col[3]],
                type:"qua"
            };
            var isVisible = false;
            if(thisLegModel.tryEveryQuaNormal===true){
                if(vDotProduct(threePointNormal(qua),qua.v1)<0){isVisible=true;}
                else if(vDotProduct(threePointNormal({v1:qua.v2,v2:qua.v3,v3:qua.v4}),qua.v1)<0){isVisible=true;}
                else if(vDotProduct(threePointNormal({v1:qua.v3,v2:qua.v4,v3:qua.v1}),qua.v1)<0){isVisible=true;}
                else if(vDotProduct(threePointNormal({v1:qua.v4,v2:qua.v1,v3:qua.v2}),qua.v1)<0){isVisible=true;}
            }
            else{
                if(vDotProduct(threePointNormal(qua),quaCenter(qua))<0){isVisible=true;}
            }
            if(isVisible){
                if(quaHasPositiveZVertex(qua)){
                    graphicGroup.primitives.push(qua);
                    var d = distOriginToQua(qua);
                    if(graphicGroup.depth===-1||d<graphicGroup.depth){
                        graphicGroup.depth=d;
                    }
                }
            }
        }
    }
    
    if(graphicGroup.primitives.length===0){return(false);}
    graphics.push(graphicGroup);
    return(true);
};
var drawBody = function(bodyFrame,cols,depthHackMag){
    depthHackMag = depthHackMag||0;
    
    var torsoCenter = midPoint(bodyFrame.crotchPoint,bodyFrame.neckBase);
    var torsoHeight = distPointToPoint(bodyFrame.crotchPoint,bodyFrame.neckBase);
    
    var headHeight = distPointToPoint(bodyFrame.neckBase,bodyFrame.root)*1.05;
    // calculating twist to align head to be on neck properly
    var defaultAuxVec = {
        x:bodyFrame.facingFocus.z-bodyFrame.eye.z,
        y:0,
        z:bodyFrame.eye.x-bodyFrame.facingFocus.x,
    }; // non-trig 90 degree... uh... clockwise? rotation which is a normal of the default vertical "view plane"
    var finalAuxVec = threePointNormal({
        v1:bodyFrame.facingFocus,
        v2:bodyFrame.neckBase,
        v3:bodyFrame.eye
    }); // normal of the view plane where the bottom of head points toward neck point
    var headTwist = angBetweenVectors(defaultAuxVec,finalAuxVec);
    var headElevation = elevationBetween(bodyFrame.eye,bodyFrame.facingFocus);
    /*
    var headAzimuth=0;
    if(bodyFrame.eye.x!==bodyFrame.facingFocus.x||bodyFrame.eye.z!==bodyFrame.facingFocus.z){*/ // this can't handle bad case atan2 for all orientations. it's cleaner to just not allow the facingFocus be generate directly below or above.
    var headAzimuth = azimuthBetween(bodyFrame.eye,bodyFrame.facingFocus);
    // it's still kinda weird how the elevation switches the head's facing direction (front/back) at an odd spot
    
    if(finalAuxVec.y<0){headTwist*=-1;} // if the normal of the final viewing plane is facing downward, then it has passed to the other side where it needs to be flipped.
    
    
    if(drawModel(monitorHeadModel,bodyFrame.eye.x,bodyFrame.eye.y,bodyFrame.eye.z,headHeight*0.55,headHeight*0.66,headHeight*0.55,headAzimuth,headElevation,headTwist,cols[0],true)&&depthHackMag){
        graphics[graphics.length-1].depth-=depthHackMag*1.5;
    }
    if(drawModel(torsoModel,torsoCenter.x,torsoCenter.y,torsoCenter.z,torsoHeight*0.45,torsoHeight*0.55,torsoHeight*0.43,bodyFrame.azimuth,bodyFrame.elevation,bodyFrame.twist,cols[1],true)&&depthHackMag){
        graphics[graphics.length-1].depth-=depthHackMag*1.5;
    } // og const: 0.5,0.6,0.45
    
    if(drawLeg(bodyFrame.leftHip,bodyFrame.leftKnee,bodyFrame.leftFoot,0,cols[4],true)&&depthHackMag){
        graphics[graphics.length-1].depth-=depthHackMag;
    }
    if(drawArm(bodyFrame.leftShoulder,bodyFrame.leftElbow,bodyFrame.leftHand,cols[2],true)&&depthHackMag){
        graphics[graphics.length-1].depth-=depthHackMag;
    }
    if(drawLeg(bodyFrame.rightHip,bodyFrame.rightKnee,bodyFrame.rightFoot,1,cols[5],true)&&depthHackMag){
        graphics[graphics.length-1].depth-=depthHackMag;
    }
    if(drawArm(bodyFrame.rightShoulder,bodyFrame.rightElbow,bodyFrame.rightHand,cols[3],true)&&depthHackMag){
        graphics[graphics.length-1].depth-=depthHackMag*2;
    }
};

var drawHotAirBalloon = function(x,y,z,rad,azimuth,cols,lightable){
    var layers = 10;
    var layerSides = cols.length||10;
    
    if(lightable===undefined){
        lightable=true;
    }
    
    var complexAzimuth = angToComplex(azimuth);
    
    var processedCoordData = [];
    var lowestCoord, penY, penLevelRad;
    for(var l = 0; l<layers; l++){
        var levelY = 2*pow((l+1+0.3*(l===0)-0.3*(l===layers-1))/(layers),0.55)-1;
        for(var ang = 0; ang<360-0.0001; ang+=360/layerSides){
            var i = processedCoordData.length;
            var levelRad = rad*cos(l/(layers-1)*180-90);
            var useAng = ang;
            if(cols.length){
                useAng+=((cols[i%cols.length][2]%7)*(cols[i%cols.length][1]%13)%11)*0.08*360/layerSides;
            }

            processedCoordData[i]={
                x:levelRad*cos(useAng),
                y:1.7*rad*levelY,
                z:levelRad*sin(useAng),
            };

            complexRotateAzimuth(processedCoordData[i],complexAzimuth);
            processedCoordData[i].x+=x;
            processedCoordData[i].y+=y;
            processedCoordData[i].z+=z;
            if(!l){
                lowestCoord = pCopy(processedCoordData[i]);
            }
            if(l===1){
                penY = processedCoordData[i].y;
                penLevelRad = levelRad;
            }
            complexAdjustPointForCamera(processedCoordData[i]);            
            // if(l===1){
            //     processedCoordData[i-layerSides] = vScale(vAdd(processedCoordData[i],processedCoordData[i-layerSides]),0.5);
            // } // sketchy to do this after transforms
        }
    }
    
    if(col===undefined){col=[255,0,255,170+75*sin(ganime*3)];}
    var graphicGroup = {
        lightable:lightable,
        depth:-1,
        primitives:[],
        needsSorting:false,
    };
    for(var l = 0; l<layers-1; l++){
        for(var i = 0; i<layerSides; i++){
            var col = cols[i] || [255,0,0,255];
            var qua = {
                v1:pCopy(processedCoordData[l*layerSides+i]),
                v2:pCopy(processedCoordData[(l+1)*layerSides+i]),
                v3:pCopy(processedCoordData[(l+1)*layerSides+(i+1)%layerSides]),
                v4:pCopy(processedCoordData[l*layerSides+(i+1)%layerSides]),
                col:[col[0],col[1],col[2],col[3]],
                type:"qua"
                // no shading
            };
            if(l===layers-2){
                var swap = pCopy(qua.v2);
                qua.v2 = pCopy(qua.v4);
                qua.v4 = swap;
                swap = pCopy(qua.v3);
                qua.v3 = pCopy(qua.v1);
                qua.v1 = swap;
            }
            var isVisible = false;
            if(vDotProduct(threePointNormal(qua),quaCenter(qua))<0){isVisible=true;}
            
            /*
            var qc = quaCenter(qua);
            if(vDotProduct(threePointNormal(qua),qc)<0){isVisible=true;}
            else if(vDotProduct(threePointNormal({v1:qua.v2,v2:qua.v3,v3:qua.v4}),qc)<0){isVisible=true;}
            else if(vDotProduct(threePointNormal({v1:qua.v3,v2:qua.v4,v3:qua.v1}),qc)<0){isVisible=true;}
            else if(vDotProduct(threePointNormal({v1:qua.v4,v2:qua.v1,v3:qua.v2}),qc)<0){isVisible=true;}
            */
            if(isVisible){
                if(quaHasPositiveZVertex(qua)){
                    graphicGroup.primitives.push(qua);
                    var d = distOriginToQua(qua);
                    if(graphicGroup.depth===-1||d<graphicGroup.depth){
                        graphicGroup.depth=d;
                    }
                }
            }
        }
    }


    // for(var ang = 0; ang<360; ang+=90){
    //     drawLine({
    //         v1:{x:x+penLevelRad*cos(ang),y:penY,z:z+penLevelRad*sin(ang)},
    //         v2:{x:x+0.8*penLevelRad*cos(ang),y:penY-20,z:z+0.8*penLevelRad*sin(ang)},
    //         rad:1,
    //         col:[0,0,255,255],
    //     },false);
    // }

    
    if(graphicGroup.primitives.length){
        graphics.push(graphicGroup);
        return true;
    }
    return false;
};

var drawT3dLogo = function(x,y,s,time,blackBackground){
    // this function is kinda sketchy. uses oCopy on c
    if(time===0||time===undefined){
        if(blackBackground){background(0);}
        var pos = [];
        for(var i = 0; i<7; i++){
            pos[i]={
                x:round(cos(i*60-90)*s)+x,
                y:round(sin(i*60-90)*s)+y,
            };
        }
        strokeWeight(s/10);
        stroke(255);
        for(var i = 0; i<6; i++){
            line(pos[i].x,pos[i].y,pos[i+1].x,pos[i+1].y);
            if(i!==4){
                // idk the bottom one kinda sticks out
                line(pos[i].x,pos[i].y-0.05*s*(i===3),x,y);
            }
        }
        fill(255);
        triangle(pos[0].x,pos[0].y,pos[5].x,pos[5].y,x,y);
    }
    else if(time>0){
        if(time>100){time=100;}
        var cUsedToBe = oCopy(c);
        
        
        //var animationValue = anyPow(cos(time*1.8),0.65); // og
        var animationValue = anyPow(cos(time*1.8),1);
        
        //var big = pow(10,map(min(50,time),0,50,3,0.5)); // og
        var big = pow(map(animationValue,1,-1,2.7,1.1),8);
        c.zoom=big/map(pow(time,2),0,10000,4.08,0.66); // no idea what this is either lool
        var backwallOpacity = constrain(map(pow(time,1.5),0,1000,380,-30),0,255);
        var processedCoordData = [];
        for(var i = 0; i<cubeModel.coordData.length; i++){
            processedCoordData[i]={
                x:cubeModel.coordData[i].x,
                y:cubeModel.coordData[i].y,
                z:cubeModel.coordData[i].z,
            };
            angRotatePointATE(processedCoordData[i],origin,
            
            map(pow(1.00001+animationValue,1.3),2.4623,0,45,0),
            map(pow(1.00001-animationValue,1.3),0,2.4623,-35.3,0),
            /* og:
            map(animationValue,1,-1,45,0),
            map(animationValue,1,-1,-35.3,0),
            */
            
            0); // i have no clue where -35.3 comes from
            processedCoordData[i].z+=big;
        }
        var quas = [];
        for(var i = 0; i<cubeModel.quaData.length; i++){
            quas.push({
                v1:processedCoordData[cubeModel.quaData[i].v1],
                v2:processedCoordData[cubeModel.quaData[i].v2],
                v3:processedCoordData[cubeModel.quaData[i].v3],
                v4:processedCoordData[cubeModel.quaData[i].v4],
            });
        }
        var types = [0,82804590,1,1,1,0];
        if(blackBackground){
            fill(0);
            noStroke();
            var v1 = vAdd(sctpc(quas[1].v1,c),{x:x,y:y}),
                v2 = vAdd(sctpc(quas[1].v2,c),{x:x,y:y}),
                v3 = vAdd(sctpc(quas[1].v3,c),{x:x,y:y}),
                v4 = vAdd(sctpc(quas[1].v4,c),{x:x,y:y});
            beginShape();
            vertex(0,height+s/100);
            vertex(0,0);
            vertex(width,0);
            vertex(width,height);
            vertex(0,height);
            vertex(v3.x,v3.y);
            vertex(v2.x,v2.y);
            vertex(v1.x,v1.y);
            vertex(v4.x,v4.y);
            vertex(v3.x,v3.y+s/100);
            endShape(CLOSE);
        }
        var order = [], seen = [];
        for(var i = 0; i<quas.length; i++){
            seen[i]=false;
            // doing this because shoving it in the initialization actually makes js ignore where rerunning (when editing code...)
        }
        for(var i = 0; i<quas.length; i++){
            var closestId = -1;
            for(var j = 0; j<quas.length; j++){
                if((!seen[j])&&(closestId===-1||distPointToPoint(quaCenter(quas[j]),origin)>distPointToPoint(quaCenter(quas[closestId]),origin))){
                    closestId=j;
                }
            }
            seen[closestId]=true;
            order.push(closestId);
        }
        //fill(0,150);
        stroke(255);
        strokeWeight(s/10);
        for(var i = 0; i<order.length; i++){
            switch(types[order[i]]){
                case 0:noFill();break;
                case 1:fill(0);break;
                default:fill(255,backwallOpacity);break;
            }
            var v1 = vAdd(sctpc(quas[order[i]].v1,c),{x:x,y:y}),
                v2 = vAdd(sctpc(quas[order[i]].v2,c),{x:x,y:y}),
                v3 = vAdd(sctpc(quas[order[i]].v3,c),{x:x,y:y}),
                v4 = vAdd(sctpc(quas[order[i]].v4,c),{x:x,y:y});
            quad(v1.x,v1.y,v2.x,v2.y,v3.x,v3.y,v4.x,v4.y);
        }
        noStroke();
        c=oCopy(cUsedToBe);
    }
};
var drawLogoScreen = function(){
    push();
    if(usingWebgl){
        translate(-width/2,-height/2);
    }
    background(0);
    drawT3dLogo(width/2,height/2,min(width,height)/5,0);
    fill(255);
    push();
    noStroke();
    textAlign(CENTER,CENTER);
    textSize(ceil(min(width,height)/23));
    //text("Why did I make this logo thing",width/2,width/5);
    text("Click to start",width/2,0.83*height);
    text("Controls: WASD, space, mouse",width/2,0.77*height);
    pop();
    pop();
}











/// ~~~~~~~~~~~~ MUSIC ENGINE ~~~~~~~~~~~~ ///

var scripts = []; // {time(countdown),func(function),argObj(obj)}
var doScripts = function(){
    for(var i = scripts.length-1; i>-1; i--){
        scripts[i].time--;
        if(scripts[i].time<=0){
            scripts[i].todo = true; // maybe this is a bad/slow way to do it
        }
    }
    for(var i = scripts.length-1; i>-1; i--){
        if(scripts[i].todo===true){ // otherwise undefined
            scripts[i].func(scripts[i].argObj);
            if(scripts[i].time<-1){console.log("ERROR: script["+i+"] timer = "+scripts[i].time);}
            scripts.splice(i,1);
        }
    }
};


var masterVolume = 0.1;
var mainAudioNodesCloned = 0; // goes to 33 by first 33 frames
var sounds = [
    "rpg/battle-magic", //0
    "rpg/battle-spell",
    "rpg/battle-swing",
    "rpg/coin-jingle",
    "rpg/door-open",
    "rpg/giant-hyah", //5
    "rpg/giant-no",
    "rpg/giant-yah",
    "rpg/hit-clop",
    "rpg/hit-splat",
    "rpg/hit-thud", //10
    "rpg/hit-whack",
    "rpg/metal-chime",
    "rpg/metal-clink",
    "rpg/step-heavy",
    "rpg/water-bubble", //15
    "rpg/water-slosh",
    "retro/boom1",
    "retro/boom2",
    "retro/coin",
    "retro/hit1", //20
    "retro/hit2",
    "retro/jump1",
    "retro/jump2",
    "retro/laser1",
    "retro/laser2", //25
    "retro/laser3",
    "retro/laser4",
    "retro/rumble",
    "retro/thruster-short",
    "retro/thruster-long", //30
    "retro/whistle1",
    "retro/whistle2",
];

var audioNodeGroups = []; // an array of groups, each being an array of audio nodes cloned from the same source html obj (and thus are functionally identical when "rented"). this exists since node cloning in mass can cause some lag and is sketchy (though no memory leak)
// each audioNode, in addition to default attributes, has a "lifetime" countdown to 0.
for(var i = 0; i<sounds.length; i++){
    audioNodeGroups.push([]);
}
audioNodeGroups.generateNewClone = function(nodeGroupId){
    var audioNode = getSound(sounds[nodeGroupId]).audio.cloneNode(false);audioNode.lifetime=0;audioNodeGroups[nodeGroupId].push(audioNode);
};

var findReplaceableNode = function(groupId){
    if(audioNodeGroups[groupId].length===0){return(-1);}
    
    // find the node with the least lifetime left
    var bestNodeSoFar = 0;
    for(var i = 1; i<audioNodeGroups[groupId].length; i++){
        if(audioNodeGroups[groupId][i].lifetime<audioNodeGroups[groupId][bestNodeSoFar].lifetime){
            bestNodeSoFar = i;
        }
    }
    return(bestNodeSoFar);
};

var cMajorScale = [0,2,4,5,7,9,11,12];
var gtcEmpty = [-8,-3,2,7,11,16];
var gtcC = [0,4,7,12,16];
var gtcCx = [-5,0,4,7,12,16];
var gtcC7 = [0,4,10,12,16];
var gtcD7 = [-3,2,9,12,18];
var gtcAm = [-8,-3,4,9,12,16];
var gtcF = [-7,0,5,9,12,17];
var gtcG = [-5,-1,2,7,11,19];
var gtcG7 = [-5,-1,2,7,11,17];

var CChords = [
    {t:0,c:gtcC},
    {t:1,c:gtcC},
    {t:1,c:gtcC},
    {t:1,c:gtcC},
    {t:1,c:gtcC},
    {t:1,c:gtcC},
    {t:1,c:gtcC},
    {t:1,c:gtcC},
];
var dontForgetMelody = [
    {t:0,n:4}, // don't you know?
    {t:5/32,n:5},
    {t:3/32,n:7},
    {t:1/2,n:9},
    {t:5/32,n:7},
    {t:3/32,n:4},
    {t:1/2,n:4},
    {t:5/32,n:4},
    {t:3/32,n:2},
    {t:1/4,n:0},
    {t:1/4,n:2},
    {t:1/4,n:4},
    
    {t:1/2,n:4}, // he's not far like the stars
    {t:5/32,n:5},
    {t:3/32,n:7},
    {t:1/2,n:9},
    {t:5/32,n:7},
    {t:3/32,n:4},
    {t:1/2,n:4},
    {t:5/32,n:4},
    {t:3/32,n:4},
    {t:1/4,n:2},
    
    {t:1,n:4}, // if you fall
    {t:5/32,n:5},
    {t:3/32,n:7},
    {t:1/2,n:9},
    {t:5/32,n:7},
    {t:3/32,n:4},
    {t:1/2,n:4},
    {t:5/32,n:4},
    {t:3/32,n:2},
    {t:1/4,n:0},
    {t:1/4,n:-3},
    {t:1/4,n:-5},
    
    {t:1/2,n:0}, // then with his strength
    {t:5/32,n:-1},
    {t:3/32,n:-3},
    {t:5/32,n:0},
    {t:11/32,n:-5},
    {t:5/32,n:-5},
    {t:3/32,n:4},
    {t:5/32,n:4},
    {t:11/32,n:2},
    {t:1/4,n:0},
        {t:13/32,n:-5},
        {t:3/32,n:-3},
        {t:5/32,n:0},
        {t:3/32,n:0},
    
    
    {t:13/32,n:0},
    {t:3/32,n:4},
    {t:5/32,n:7},
    {t:3/32,n:9},
    {t:24/32,n:5},
    
    {t:13/32,n:0},
    {t:3/32,n:9},
    {t:5/32,n:9},
    {t:3/32,n:7},
    {t:24/32,n:4},
    
    {t:13/32,n:0},
    {t:3/32,n:4},
    {t:5/32,n:5},
    {t:3/32,n:7},
    {t:1/4,n:7},
    {t:1/4,n:7},
    {t:1/4,n:9},
    {t:1/4,n:7},
    {t:1/4,n:4},
    {t:1/4,n:2},
        {t:1/2,n:9},
        {t:1/4,n:7},
    
    {t:1/2,n:4},
    {t:5/32,n:5},
    {t:3/32,n:7},
    {t:1/2,n:9},
    {t:5/32,n:7},
    {t:3/32,n:4},
    {t:1/2,n:4},
    {t:5/32,n:4},
    {t:3/32,n:2},
    {t:5/32,n:4},
    {t:3/32,n:2},
    {t:5/32,n:0},
    {t:3/32,n:-3},
    {t:5/32,n:-5},
    {t:3/32,n:-8},
    {t:5/32,n:-5},
    {t:3/32,n:-12},
    
    {t:8/32,n:0},
    {t:5/32,n:-1},
    {t:3/32,n:-3},
    {t:5/32,n:0},
    {t:1/4,n:-5},
    {t:3/32,n:-5},
    {t:5/32,n:-8},
    {t:3/32,n:4},
    {t:5/32,n:4},
    {t:11/32,n:2},
    {t:1/4,n:0},
];
var dontForgetChords = [
    {t:0.25,c:gtcC},
    {t:0.75,c:gtcAm},
    {t:0.75,c:gtcF},
    {t:0.75,c:gtcC},
    {t:0.75,c:gtcC},
    {t:0.75,c:gtcAm},
    {t:0.75,c:gtcG},
    {t:0.75,c:gtcG7},
    {t:0.75,c:gtcC},
    {t:0.75,c:gtcAm},
    {t:0.75,c:gtcF},
    {t:0.75,c:gtcC},
    {t:0.75,c:gtcF},
    {t:0.75,c:gtcG},
    {t:0.75,c:gtcC},
    {t:0.75,c:gtcC7},
    
    {t:0.75,c:gtcF},
    {t:0.75,c:gtcF},
    {t:0.75,c:gtcC},
    {t:0.75,c:gtcC},
    {t:0.75,c:gtcC},
    {t:0.75,c:gtcAm},
    {t:0.75,c:gtcD7},
    {t:0.75,c:gtcG7},
    
    {t:0.75,c:gtcC},
    {t:0.75,c:gtcAm},
    {t:0.75,c:gtcF},
    {t:0.75,c:gtcC},
    {t:0.75,c:gtcF},
    {t:0.75,c:gtcG7},
    //{t:0.75,c:gtcC},
]; // still used
var dontForgetChords2 = [
    {t:0.25,c:gtcCx},
    {t:0.75,c:gtcAm},
    {t:0.75,c:gtcF},
    {t:0.75,c:gtcCx},
    {t:0.75,c:gtcCx},
    {t:0.75,c:gtcAm},
    {t:0.75,c:gtcG},
    {t:0.75,c:gtcG7},
    {t:0.75,c:gtcCx},
    {t:0.75,c:gtcAm},
    {t:0.75,c:gtcF},
    {t:0.75,c:gtcCx},
    {t:0.75,c:gtcF},
    {t:0.75,c:gtcG},
    {t:0.75,c:gtcCx},
    {t:0.75,c:gtcC7},
    
    {t:0.75,c:gtcF},
    {t:0.75,c:gtcF},
    {t:0.75,c:gtcCx},
    {t:0.75,c:gtcCx},
    {t:0.75,c:gtcCx},
    {t:0.75,c:gtcAm},
    {t:0.75,c:gtcD7},
    {t:0.75,c:gtcG7},
    
    {t:0.75,c:gtcCx},
    {t:0.75,c:gtcAm},
    {t:0.75,c:gtcF},
    {t:0.75,c:gtcCx},
    {t:0.75,c:gtcF},
    {t:0.75,c:gtcG7},
    {t:0.75,c:gtcCx},
    {t:0.5,c:gtcF.slice(-4)},
    {t:0.25,c:gtcC},
];
var fillerMelody = [
    {t:0,n:0},
    {t:1,n:-5},
    {t:1,n:2},
    {t:1,n:-5},
    {t:1,n:4},
    {t:1,n:-5},
    {t:1,n:2},
    {t:1,n:0},
    {t:1,n:-1},
    {t:1,n:-5},
    {t:1,n:0},
    {t:1,n:-5},
    {t:1,n:2},
    {t:1,n:-5},
    {t:1,n:0},
    {t:1,n:-1},
    {t:1,n:-3},
    {t:1,n:-8},
    {t:1,n:-1},
    {t:1,n:-8},
    {t:1,n:0},
    {t:1,n:-8},
    {t:1,n:-1},
    {t:1,n:-3},
    {t:1,n:-3},
    {t:1,n:-8},
    {t:1,n:-1},
    {t:1,n:-8},
    {t:1,n:2},
    {t:1,n:-5},
    {t:1,n:4},
    {t:1,n:2},
];
var fillerBeat = [
    {t:0,n:-6},
    {t:1,n:-6},
    {t:1,n:-6},
    {t:1,n:-6},
    {t:1,n:-6},
    {t:1,n:-6},
    {t:1,n:-6},
        {t:1,n:-18},
        {t:0.5,n:-18},
    
    {t:0.5,n:-6},
    {t:1,n:-6},
    {t:1,n:-6},
    {t:1,n:-6},
    {t:1,n:-6},
    {t:1,n:-6},
    {t:1,n:-6},
        {t:1,n:6},
        {t:0.5,n:6},
        
    {t:0.5,n:6},
    {t:1,n:6},
    {t:1,n:6},
    {t:1,n:6},
    {t:1,n:6},
    {t:1,n:6},
    {t:1,n:6},
        {t:1,n:-6},
        {t:0.5,n:-6},
    
    {t:0.5,n:6},
    {t:1,n:6},
    {t:1,n:6},
    {t:1,n:6},
    {t:1,n:6},
    {t:1,n:6},
    {t:1,n:6},
        {t:1,n:18},
        {t:0.5,n:18},
];

var playNote = function(soundType,notePitch,basePitch,timeStart,lifetime,volume){
    var nextId = findReplaceableNode(soundType);
    if(nextId!==-1){
        var audioNode = audioNodeGroups[soundType][nextId];
        var pitcher = pow(2,notePitch/12);
        audioNode.preservesPitch = false;
        audioNode.playbackRate = basePitch*pitcher;
        audioNode.currentTime = timeStart;
        audioNode.lifetime = lifetime;
        audioNode.volume = constrain(masterVolume*volume,0,1);
        audioNode.play();
    }
    else if(mainAudioNodesCloned===0&&generateAudioNodes){
        console.log("no mainAudioNodes have been Cloned. something is wrong with node generation in draw function");
    }
};
// pitch 'c': #12=d=0.387, #10=c=2.6795, #19=b=0.2106, #30=s=1.5136
// pitch 'e': #10=2.839, #19=0.26534, #30=1.907
// best timestarts WITH POPPING: #10=0.03 #19=0.11 #30=0.2(continuous)
var playNoteArgObj = function(argObj){
    playNote(argObj.soundType,argObj.notePitch,argObj.basePitch,argObj.timeStart,argObj.lifetime,argObj.volume);
};
var playPitchSeries = function(argObj){
    if(argObj.id===undefined){argObj.id = 0;}
    if(argObj.betweenTime===undefined){argObj.betweenTime = 10;}
    playNote(argObj.soundType,argObj.pitchSeries[argObj.id],argObj.basePitch,argObj.timeStart,argObj.lifetime,argObj.volume);
    argObj.id++;
    if(argObj.id<argObj.pitchSeries.length){
        scripts.push({
            time:argObj.betweenTime,
            func:playPitchSeries,
            argObj:argObj
        });
    }
}; // soundType(Id), pitchSeries(pitch array reference), timeStart, basePitch, betweenTime, volume
var playChordSeries = function(series,standardChordTime,soundType,basePitch,timeStart,betweenTime,lifetime,volume,optionalTimeMod){
    var t = optionalTimeMod||0;
    for(var i = 0; i<series.length; i++){
        t+=series[i].t*standardChordTime;
        scripts.push({
            time:t,
            func:playPitchSeries,
            argObj:{pitchSeries:series[i].c,soundType:soundType,basePitch:basePitch,timeStart:timeStart,betweenTime:betweenTime,lifetime:lifetime,volume:volume},
        });
    }
}; // betweenTime = 1 is no delay actually
// ex: playNoteSeries(dontForgetMelody,120,19,0.2106*pow(2,1/6),0.18,40,1, 7);
var playNoteSeries = function(noteSeries,standardNoteTime,soundType,basePitch,timeStart,lifetime,volume,optionalTimeMod){
    var t = optionalTimeMod||0;
    for(var i = 0; i<noteSeries.length; i++){
        t+=noteSeries[i].t*standardNoteTime;
        scripts.push({
            time:t,
            func:playNoteArgObj,
            argObj:{soundType:soundType,notePitch:noteSeries[i].n,basePitch:basePitch,timeStart:timeStart,lifetime:lifetime,volume:volume},
        });
    }
};
/*
var playNoteSeriesRecursively = function(argObj){
    if(argObj.id===undefined){argObj.id = 0;}
    playNote(argObj.soundType,argObj.noteSeries[argObj.id].n,argObj.basePitch,argObj.timeStart,argObj.lifetime,argObj.volume);
    argObj.id++;
    if(argObj.id<argObj.noteSeries.length){
        scripts.push({
            time:argObj.noteSeries[argObj.id].t*argObj.standardNoteTime,
            func:playNoteSeriesRecursively,
            argObj:argObj
        });
    }
}; // soundtype, noteSeries(note obj array), timeStart, basePitch, standardNoteTime
*/

var playSongDontForget = function(){
    //*pow(2,5/12)
    playNoteSeries(dontForgetMelody,120,19,0.2106*pow(2,1/6),0.18,40,0.65, 7);
    playChordSeries(dontForgetChords2,120,19,0.2106*pow(2,-5/6),0.22,3,80,0.45, 0);
    playChordSeries(dontForgetChords,120,19,0.2106*pow(2,-5/6),0.22,3,80,0.3, 60);
        //playNoteSeries(dontForgetMelody,120,12,0.387*pow(2,-5/6),0.1,20,0.6, 7);
};

                    }
                    
/** ~~~~~~ Program Specific Context ~~~~~~ **/

                    {
screen = "map";
currentLevel = -1;

defaultZoom = 1;
var coyoteTime = 7; // 6 default, 0 = cannot jump at all

/// ~~~~~~~~~~~~  Colliders ~~~~~~~~~~~~~ ///
                    
var colliders = [];
// cylinder: {idTag,x,y,z,prevx,prevy,prevz,rad,h,giveJumpFunc,type:"cyl"}
// slope: {idTag,x,y,z,planeNorm,giveJumpFunc,type:"slp"}
// sphere: {idTag,x,y,z,prevx,prevy,prevz,rad,giveJumpFunc,surfacePushFactor,type:"sph"}
// box: {idTag,x,y,z,prevx,prevy,prevz,l,h,w,azimuth,giveJumpFunc,type:"box"}

// (only prev-values for xyz because others are too unimportant, uncommon, unreliable.) works similarly to graphics array
// box l,h,w are semis
// idTag is idTag of the oier that made it, or -1, which helps ignore "colliding with self" (bad)
var giveJump = function(oier){
    oier.canJump = coyoteTime;
};
var giveGenerousJump = function(oier){
    if(coyoteTime<2){
        oier.canJump = coyoteTime;
    }
    else{
        oier.canJump = floor(1.5*(coyoteTime+1.5));
    }
};

/// ~~~~~~~~~ Game World System ~~~~~~~~~ ///

var stars = []; // {x,y,z} dot

var solids = [];
var items = [];
var oiers = [];
var mannequins = [];

// no Surface type because it is too customizable

var Block = function(x,y,z,l,h,w,azimuth,col){
    this.x=x; this.y=y; this.z=z;
    this.prevx=x; this.prevy=y; this.prevz=z;
    this.l=l; this.h=h; this.w=w;
    this.azimuth = azimuth;
    this.col = col;
};
Block.prototype.draw = function(){
    drawModel(cubeModel,this.x,this.y,this.z,this.l,this.h,this.w,this.azimuth,0,0,this.col,true);
};
Block.prototype.makeCollider = function(){
    colliders.push({idTag:-1,
        type:"box",
        x:this.x, y:this.y, z:this.z,
        prevx:this.prevx, prevy:this.prevy, prevz:this.prevz,
        l:this.l, h:this.h, w:this.w,
        azimuth:this.azimuth,
        giveJumpFunc:giveJump
    });
};
Block.prototype.contains = function(p,pRad,pH){
    if(pRad===undefined){pRad = 0;}
    if(pH===undefined){pH = 0;}
    
    var a = vSub(p,this);
    if(abs(a.y)>this.h+pH){
        return false;
    } // y levels aren't intersecting
    
    // rotate a,b to be in box's space for easier calculations and rerotate later
    var complexAzimuth = angToComplex(this.azimuth);
    complexRotateAzimuth(a,complexConjugate(complexAzimuth));
    
    return(abs(a.x)<=this.l+pRad&&abs(a.z)<=this.w+pRad);
}; // assuming the object described by p is 2*pH tall, centered 
var Slab = function(x,y,z,l,h,w,azimuth,col){
    this.x=x; this.y=y; this.z=z;
    this.prevx=x; this.prevy=y; this.prevz=z;
    this.l=l; this.h=h; this.w=w;
    this.azimuth = azimuth;
    this.col = [col[0]+random(-4,4),col[1]+random(-4,4),col[2]+random(-4,4)];
    this.modelNum = floor(random(0,slabModels.length));
};
Slab.prototype.draw = function(){
    drawModel(slabModels[this.modelNum],this.x,this.y,this.z,this.l,this.h,this.w,this.azimuth,0,0,this.col,true);
};
Slab.prototype.makeCollider = function(){
    colliders.push({idTag:-1,
        type:"box",
        x:this.x, y:this.y, z:this.z,
        prevx:this.prevx, prevy:this.prevy, prevz:this.prevz,
        l:this.l, h:this.h, w:this.w,
        azimuth:this.azimuth,
        giveJumpFunc:giveJump
    });
};
var Bouncer = function(x,y,z,rad,turnSeed,col){
    this.x=x; this.y=y; this.z=z;
    this.prevx=x; this.prevy=y; this.prevz=z;
    this.rad=rad;
    this.turnSeed = turnSeed;
    this.col = col;
};
Bouncer.prototype.draw = function(){
    //drawModel(cubeModel,this.x,this.y,this.z,this.l,this.h,this.w,this.azimuth,0,0,this.col,true);
    drawModel(rhombicosidodecahedronModel,this.x,this.y,this.z,this.rad*0.95,this.rad*0.95,this.rad*0.95,this.turnSeed,0,0,this.col,true);
};
Bouncer.prototype.makeCollider = function(){
    colliders.push({idTag:-1,
        type:"sph",
        x:this.x, y:this.y, z:this.z,
        prevx:this.prevx, prevy:this.prevy, prevz:this.prevz,
        rad:this.rad,
        surfacePushFactor:1.85,
        giveJumpFunc:giveGenerousJump,
    });
};
var Pole = function(x,y,z,rad,h,azimuth,col){
    this.x=x; this.y=y; this.z=z;
    this.prevx=x; this.prevy=y; this.prevz=z;
    this.rad=rad; this.h=h;
    this.azimuth = azimuth;
    this.col = col;
}; // use instead of surfacePillar when hitbox have lower bound
Pole.prototype.draw = function(){
    //drawModel(cubeModel,this.x,this.y,this.z,this.l,this.h,this.w,this.azimuth,0,0,this.col,true);
    return drawModel(octoCylinderModel,this.x,this.y,this.z,this.rad,this.h,this.rad,this.azimuth,0,0,this.col,true);
};
Pole.prototype.makeCollider = function(){
    colliders.push({idTag:-1,
        type:"cyl",
        x:this.x, y:this.y, z:this.z,
        prevx:this.prevx, prevy:this.prevy, prevz:this.prevz,
        h:this.h,
        rad:this.rad,
        giveJumpFunc:giveJump
    });
};
var SurfacePillar = function(x,baseY,z,rad,hMaxTOTAL,hFactor,azimuth,col){
    this.x=x; this.baseY=baseY; this.z=z; // baseY would be at 10 if the floor is at 10 and the surface pillar emerges to above 10
    this.hMax = hMaxTOTAL;
    //this.hFactor = hFactor; // 0 to 1 indicating actual current height
    this.prevh=hMaxTOTAL*hFactor;
    this.rad=rad; this.h=hMaxTOTAL*hFactor;
    this.azimuth = azimuth;
    this.col = col;
}; // same as pole, but can grow in length from below
SurfacePillar.prototype.draw = function(){
    if(this.h>0){
        drawModel(hexaCylinderModel,this.x,this.baseY+this.h/2,this.z,this.rad,this.h/2,this.rad,this.azimuth,0,0,this.col,true);
    }
};
SurfacePillar.prototype.makeCollider = function(){
    if(this.h>0){
        colliders.push({idTag:-1,
            type:"cyl",
            x:this.x, y:this.baseY+this.h-1e5, z:this.z,
            prevx:this.prevx, prevy:this.baseY+this.prevh-1e5, prevz:this.prevz,
            h:1e5,
            rad:this.rad,
            giveJumpFunc:giveJump
        });
    }
};
SurfacePillar.prototype.grow = function(factor){
    this.prevh = this.h;
    this.h=constrain(this.h+(factor)*this.hMax,0,this.hMax);
    return(this.h-this.prevh);
};
SurfacePillar.prototype.operate = function(){
    this.prevh = this.h;
};
var Disc = function(x,y,z,rad,h,azimuth,col){
    this.x=x; this.y=y; this.z=z;
    this.prevx=x; this.prevy=y; this.prevz=z;
    this.rad=rad; this.h=h;
    this.azimuth = azimuth;
    this.col = col;
};
Disc.prototype.draw = function(){
    drawModel(discModel,this.x,this.y,this.z,this.rad,this.h,this.rad,this.azimuth,0,0,this.col,true);
    drawModel(cubeModel,this.x,(this.y-this.h)/2,this.z,this.rad/6,(this.y-this.h)/2,this.rad/6,this.azimuth,0,0,[this.col[0]*0.8,this.col[1]*0.8,this.col[2]*0.8],true);
};
Disc.prototype.makeCollider = function(){
    colliders.push({idTag:-1,
        type:"cyl",
        x:this.x, y:this.y, z:this.z,
        prevx:this.prevx, prevy:this.prevy, prevz:this.prevz,
        h:this.h,
        rad:this.rad,
        giveJumpFunc:giveJump
    });
    colliders.push({idTag:-1,
        type:"cyl",
        x:this.x, y:(this.y-this.h)/2, z:this.z,
        prevx:this.prevx, prevy:this.prevy, prevz:this.prevz,
        h:(this.y-this.h)/2,
        rad:this.rad/7,
        giveJumpFunc:giveJump
    });
};
var MediumTree = function(x,y,z,h,azimuth,elevation,generationTries,generationRad,seed,trunkCol,leafCol,leafColVariation){
    this.x=x; this.y=y; this.z=z;
    this.h=h;
    this.trunkCol = trunkCol;
    this.azimuth = azimuth;
    this.elevation = elevation;
    this.rad = generationRad;
    this.chunks = [];
    if(seed!==0){
        randomSeed(seed);
    }
    for(var i = 0; i<generationTries; i++){
        var tryElevation = constrain(2.1*pow(random(0,acos(random(0,0.99999))),0.9)-17,-17,90);
        var tryAzimuth = random(0,360)+azimuth;
        this.chunks.push({
            x:cos(tryAzimuth)*cos(tryElevation)*generationRad*random(0.75,1.13),
            y:sin(tryElevation)*generationRad*random(0.56,1.2),
            z:sin(tryAzimuth)*cos(tryElevation)*generationRad*random(0.75,1.13),
            rad:random(generationRad*0.27,generationRad*0.73),
            col:[leafCol[0]+random(-leafColVariation,leafColVariation),leafCol[1]+random(-leafColVariation/2,leafColVariation),leafCol[2]+random(-leafColVariation,leafColVariation)],
            turnSeed:random(0,360)
        });
        for(var j = 0; j<this.chunks.length-1; j++){
            if(distPointToPoint(this.chunks[this.chunks.length-1],this.chunks[j])<(this.chunks[this.chunks.length-1].rad+this.chunks[j].rad)*0.9){
                this.chunks.pop();
                break;
            }
        }
    }
    var complexLeanAzimuth = angToComplex(azimuth);
    var complexLeanElevation = angToComplex(elevation-90);
    for(var i = 0; i<this.chunks.length; i++){
        this.chunks[i].y+=this.h*2;
        complexRotatePointTEA(this.chunks[i],origin,complexLeanAzimuth,complexLeanElevation,complexOne);
        setGoByVector(this.chunks[i],this);
    }
    if(seed!==0){
        randomSeed(millis());
    }
};
MediumTree.prototype.draw = function(){
    var trunkCenter = {x:this.x+this.h*1.1*cos(this.elevation)*cos(this.azimuth+90),y:this.y+this.h*1.1*sin(this.elevation),z:this.z+this.h*1.1*cos(this.elevation)*sin(this.azimuth+90)};
    drawModel(spikeyTreeTrunkModel,trunkCenter.x,trunkCenter.y,trunkCenter.z,this.rad*0.65,this.h*1.1,this.rad*0.65,this.azimuth,this.elevation-90,0,this.trunkCol,true);
    for(var i = 0; i<this.chunks.length; i++){
        var chunki = this.chunks[i];
        if(chunki.rad>1.3){
            drawModel(icosahedronModel,chunki.x,chunki.y,chunki.z,chunki.rad*0.93,chunki.rad*0.93,chunki.rad*0.93,chunki.turnSeed,chunki.turnSeed,chunki.turnSeed*3.7,chunki.col,true);
        }
        else{
            drawModel(octahedronModel,chunki.x,chunki.y,chunki.z,chunki.rad*1.04,chunki.rad*1.04,chunki.rad*1.04,chunki.turnSeed,chunki.turnSeed,chunki.turnSeed*3.7,chunki.col,true);
        }
    }
};
MediumTree.prototype.makeCollider = function(){
    if(abs(this.elevation-90)<3){
        colliders.push({idTag:-1,
            type:"cyl",
            x:this.x, y:this.y+this.h, z:this.z,
            prevx:this.x, prevy:this.y+this.h, prevz:this.z,
            h:this.h,
            rad:this.rad*0.3,
            giveJumpFunc:giveJump
        });
    }
    else{
        var segments = round(constrain(this.h/(this.rad*0.3)*2,2,20));
        var branchingPoint = vAdd(this,vScale(angsToVector(this.azimuth,this.elevation),this.h*2));
        for(var i = 0; i<segments; i++){
            var segmentFactor = map(2*i+1,0,2*segments,0,1);
            var newCoords = lerpPoints(this,branchingPoint,segmentFactor);
            colliders.push({idTag:-1,
                type:"sph",
                x:newCoords.x, y:newCoords.y, z:newCoords.z,
                prevx:newCoords.x, prevy:newCoords.y, prevz:newCoords.z,
                rad:this.rad*0.31,
                surfacePushFactor:0,
                giveJumpFunc:giveGenerousJump
            });
        }
    }
    for(var i = 0; i<this.chunks.length; i++){
        var chunki = this.chunks[i];
        colliders.push({idTag:-1,
            type:"sph",
            x:chunki.x, y:chunki.y, z:chunki.z,
            prevx:chunki.x, prevy:chunki.y, prevz:chunki.z,
            rad:chunki.rad,
            surfacePushFactor:0.4,
            giveJumpFunc:giveGenerousJump
        });
    }
};

var Block = function(x,y,z,l,h,w,azimuth,col){
    this.x=x; this.y=y; this.z=z;
    this.prevx=x; this.prevy=y; this.prevz=z;
    this.l=l; this.h=h; this.w=w;
    this.azimuth = azimuth;
    this.col = col;
};
Block.prototype.draw = function(){
    drawModel(cubeModel,this.x,this.y,this.z,this.l,this.h,this.w,this.azimuth,0,0,this.col,true);
};
Block.prototype.makeCollider = function(){
    colliders.push({idTag:-1,
        type:"box",
        x:this.x, y:this.y, z:this.z,
        prevx:this.prevx, prevy:this.prevy, prevz:this.prevz,
        l:this.l, h:this.h, w:this.w,
        azimuth:this.azimuth,
        giveJumpFunc:giveJump
    });
};

var WindowBlock = function(x,y,z,l,h,w,azimuth,col,windowLowH,windowHighH,windowCol){
    Block.call(this,x,y,z,l,h,w,azimuth,col);
    this.windowCol = windowCol;
    this.windowLowH = windowLowH; // between 0 and 1
    this.windowHighH = windowHighH; // between 0 and 1, higher than windowLowH
}
WindowBlock.prototype = Object.create(Block.prototype);
WindowBlock.prototype.draw = function(){
    drawModel(cubeModel,this.x,this.y+this.h*(this.windowLowH-1),this.z,this.l,this.h*this.windowLowH,this.w,this.azimuth,0,0,this.col,true);
    drawModel(cubeModel,this.x,this.y,this.z,this.l,this.h*(this.windowHighH-this.windowLowH),this.w,this.azimuth,0,0,this.windowCol,true);
    drawModel(cubeModel,this.x,this.y+this.h*this.windowHighH,this.z,this.l,this.h*(1-this.windowHighH),this.w,this.azimuth,0,0,this.col,true);
}



var Item = function(x,y,z){
    this.x=x; this.y=y; this.z=z;
    this.azimuth = random(0,360);
};
Item.prototype.testPickUp = function(){
    // drawModel(rhombicosidodecahedronModel,player.x,player.y+player.eyeLevel/2,player.z,2.2,2.2,2.2,this.azimuth,60,ganime*3,[260,240,0],true);
    if(distPointToPoint(this,{x:player.x,y:player.y+player.eyeLevel/3,z:player.z})<2.25||distPointToPoint(this,{x:player.x,y:player.y+2*player.eyeLevel/3,z:player.z})<2.25){
        this.pickUp();
        return(true);
    }
    return(false);
}; // MAYBE I SHOULD GENERALIZE TO ALL OIERS?

var Coin = function(x,y,z){
    Item.call(this,x,y,z);
};
Coin.prototype = Object.create(Item.prototype);
Coin.prototype.draw = function(){
    drawModel(octoCylinderModel,this.x,this.y,this.z,0.67,0.2,0.67,this.azimuth,60,ganime*3,[260,240,0],true);
};
Coin.prototype.pickUp = function(){
    player.inv.coins++;
    playNote(19,0,random(0.9,1.05),0,100,0.5);
};

var Boost = function(x,y,z){
    Item.call(this,x,y,z);
};
Boost.prototype = Object.create(Item.prototype);
Boost.prototype.draw = function(){
    this.azimuth=(this.azimuth+4)%360;
    // drawModel(arrowModel,this.x,this.y+sin(this.azimuth)/2,this.z,0.4,0.8+cos(this.azimuth)*0.3,0.4,this.azimuth,0,0,[260,240,0],true);
    drawModel(arrowModel,this.x,this.y+sin(this.azimuth*3)*0.5,this.z,0.9,1.1,0.9,this.azimuth/3,0,0,[275,20,290],true);
};
Boost.prototype.pickUp = function(){
    player.inv.boosts++;
    playNote(23,0,random(0.3,0.35),0,100,0.85);
};





var Oier = function(x,y,z,rad,h,eyeLevel,azimuth,elevation,twist,airFrictionFactor,groundFrictionFactor,airAccelerationFactor,hp){
    this.x=x; this.y=y; this.z=z; // world axis coords, position of feet
    this.rad=rad; this.eyeLevel=eyeLevel; this.h=h; // sizes (rad isn't always precisely the radius, it's the generosity used on hitboxes and collisions.) eyelevel is added on to this.y to determine camera position on player
     
    this.azimuth=azimuth; this.elevation=elevation; this.twist=twist;
    
    this.xv=0; this.yv=0; this.zv=0;
    this.airFrictionFactor = airFrictionFactor;
    this.groundFrictionFactor = groundFrictionFactor;
    this.airAccelerationFactor = airAccelerationFactor;
    this.canJump = 0;
    
    this.hp=hp;
    this.idTag = floor(random(0,1e18));
    
    this.stats = {
        hp:hp,
        airFrictionFactor:airFrictionFactor,
        groundFrictionFactor:groundFrictionFactor,
    };
};
Oier.prototype.drift = function(yDefault){
    //console.log(dt);
    
    this.xv*=this.airFrictionFactor;
    if(yDefault){
        this.yv*=this.airFrictionFactor;
    }
    else{
        this.yv*=0.98;
    }
    this.zv*=this.airFrictionFactor; // friction must come first, that way the previous coords can be calculated by subtracting veloxity from current
    if(this.canJump){
        this.groundFriction();
    }
    this.x+=this.xv;
    this.y+=this.yv;
    this.z+=this.zv;
};
Oier.prototype.gravity = function(mag){
    if(mag===undefined){mag=0.013;}
    this.yv-=mag;
};
Oier.prototype.groundFriction = function(){
    this.xv*=this.groundFrictionFactor;
    this.zv*=this.groundFrictionFactor;
};
Oier.prototype.vectorAccelerate = function(vec){
    this.xv+=vec.x;
    this.yv+=vec.y;
    this.zv+=vec.z;
};
Oier.prototype.azimuthAccelerate = function(azimuth,mag){
    this.xv+=cos(azimuth)*mag;
    this.zv+=sin(azimuth)*mag;
};
// incomplete, no slp interation for slopes that are like ceilings, and only cyl really supports motion, except maybe sph ig
Oier.prototype.interactWithColliders = function(useMovementLine,needsSorting){
    // must come after all colliders have been created for that frame... which may be annoying in some cases.
    
    if(useMovementLine===undefined){
        useMovementLine=false;
    }
    if(needsSorting===undefined){
        needsSorting = false;
    }
    
    var crownLevel = this.y+this.h;
    
    var hit = false;
    
    // you might need to sort colliders by distance to the oier if you want side-by-side colliders to be smoothly walkable.
    // i think it does matter even though you don't break;
    if(needsSorting){
        colliders.sort((a, b) => (sq(a.x-this.x)+sq(a.y-this.y)+sq(a.z-this.z)) - (sq(b.x-this.x)+sq(b.y-this.y)+sq(b.z-this.z)));
    }
    
    for(var i = 0; i<colliders.length; i++){
        var collider = colliders[i];
        if(collider.idTag!==this.idTag){
            switch(collider.type){
                case "box":
                    var a = vSub(this,collider);
                    var b = vSub({x:this.x-this.xv,y:this.y-this.yv,z:this.z-this.zv},collider);
                    // rotate a,b to be in box's space for easier calculations and rerotate later
                    if(a.y>collider.h&&b.y>collider.h){continue;} if(a.y+this.h<-collider.h&&b.y+this.h<-collider.h){continue;} // no intersection in these cases (y levels aren't intersecting)
                    
                    var complexAzimuth = angToComplex(collider.azimuth);
                    complexRotateAzimuth(a,complexConjugate(complexAzimuth));
                    complexRotateAzimuth(b,complexConjugate(complexAzimuth));
                    
                    var v = vSub(a,b); // rotated velocity vec
                    
                    if(abs(a.x)<collider.l+this.rad&&abs(a.z)<collider.w+this.rad){
                        hit = true;
                        // is intersecting in 3d
                        
                        // 0.00001 slack eliminates floating point error when subtracting to find b values
                        if(b.y+0.00001>collider.h){
                            // landed on the platform successfully
                            if(v.y<=0){
                                // basically, don't do this if already jumped off, but still catch it into this case
                                a.y=collider.h;
                                v.y=0;
                                collider.giveJumpFunc(this);
                            }
                        }
                        else if(b.y+this.h-0.00001<-collider.h){
                            // hit head on bottom
                            if(v.y>=0){
                                a.y=-collider.h-this.h;
                                v.y=0;
                            }
                        }
                        else{
                            // hit one of the walls. lazy method: divide space into 4 almost right-triangular regions and check previous position
                            var invertBack = false;
                            if(collider.l<collider.w){
                                invertBack = true;
                                var swap=collider.l; collider.l=collider.w; collider.w=swap; swap=a.x; a.x=a.z; a.z=swap; swap=b.x; b.x=b.z; b.z=swap; swap=v.x; v.x=v.z; v.z=swap;
                                // make sure collider.l>=collider.w during code underneath
                            }
                            // now guaranteed that left and right are the smaller sides, and have triangle hitbox with vertices (-l+w,0),(l-w,0)
                            // https://www.desmos.com/calculator/xcyheswpaa
                            if(abs(b.z)<=-b.x-(collider.l-collider.w)){
                                // from left
                                a.x=-collider.l-this.rad;
                                v.x=0;
                            }
                            else if(abs(b.z)<=b.x-(collider.l-collider.w)){
                                a.x=collider.l+this.rad;
                                v.x=0;
                            }
                            else if(b.z<0){
                                // from below/front z
                                a.z=-collider.w-this.rad;
                                v.z=0;
                            }
                            else{
                                a.z=collider.w+this.rad;
                                v.z=0;
                            }
                            
                            if(invertBack){
                                var swap=collider.l; collider.l=collider.w; collider.w=swap; swap=a.x; a.x=a.z; a.z=swap; swap=b.x; b.x=b.z; b.z=swap; swap=v.x; v.x=v.z; v.z=swap;
                            }
                        }
                        
                        complexRotateAzimuth(a,complexAzimuth);
                        complexRotateAzimuth(v,complexAzimuth);
                        var newPos = vAdd(a,collider);
                        this.x=newPos.x;
                        this.y=newPos.y;
                        this.z=newPos.z;
                        this.xv=v.x;
                        this.yv=v.y;
                        this.zv=v.z;
                    }
                    break;
                case "cyl":
                    if(this.y<=collider.y+collider.h&&this.y+this.h>=collider.y-collider.h&&dist(this.x,this.z,collider.x,collider.z)<=collider.rad+this.rad){
                        hit = true;
                        if(this.y-this.yv+0.00001>=collider.prevy+collider.h){ // yes, you do need the decimal to avoid occasional precision errors
                            // from above
                            // this.yv=max(0,this.yv);
                            this.yv=max(collider.y-collider.prevy,this.yv);
                            this.y=collider.y+collider.h;
                            collider.giveJumpFunc(this);
                        }
                        else if(this.y-this.yv+this.h-0.00001<=collider.prevy-collider.h){
                            // from below
                            // this.yv=min(0,this.yv);
                            this.yv=min(collider.y-collider.prevy,this.yv);
                            this.y=collider.y-collider.h-this.h;
                        }
                        else{
                            // console.log(this.y+" "+this.yv+" "+collider.prevy+" "+collider.y);
                            var outwardUnitVector = vNormalize({
                                x:this.x-collider.x,
                                y:0,
                                z:this.z-collider.z,
                            });
                            this.x=collider.x+outwardUnitVector.x*(collider.rad+this.rad);
                            this.z=collider.z+outwardUnitVector.z*(collider.rad+this.rad);
                        }
                    }
                    break;
                case "sph":
                    if(this.y<=collider.y+collider.rad&&this.y+this.h>=collider.y-collider.rad){
                        var centerD = dist(this.x,this.z,collider.x,collider.z);
                        if(this.y>collider.y){
                            if(centerD<this.rad+collider.rad*sin(acos((this.y-collider.y)/collider.rad))){
                                hit = true;
                                if(centerD<this.rad){
                                    this.yv=max(this.yv,0);
                                    this.y=collider.y+collider.rad;
                                }
                                else{
                                    var baseToContactPoint = vScale(vNormalize({x:collider.x-this.x,y:0,z:collider.z-this.z}),this.rad);
                                    var contactPoint = vAdd(this,baseToContactPoint);
                                    // update contact point to be on the surface of the sphere
                                    var outwardUnitVector = vNormalize(vSub(contactPoint,collider)); // unit vector
                                    contactPoint = vAdd(collider,vScale(outwardUnitVector,collider.rad));
                                    var newBase = vSub(contactPoint,baseToContactPoint);
                                    this.x=newBase.x;
                                    this.y=newBase.y;
                                    this.z=newBase.z;
                                    if(collider.surfacePushFactor===undefined){
                                        collider.surfacePushFactor=1;
                                    }
                                    var pushStrength = max(0,-this.yv)*collider.surfacePushFactor; //var pushStrength = velocityLength(this)*max(0,-vDotProduct(velocityToUnitVector(this),outwardUnitVector));
                                    this.xv+=outwardUnitVector.x*pushStrength;
                                    this.yv=max(this.yv,0);
                                    this.zv+=outwardUnitVector.z*pushStrength;
                                }
                                collider.giveJumpFunc(this);
                            }
                        }
                        else if(this.y+this.h<collider.y){
                            var circleRadius = collider.rad*sin(acos((collider.y-this.y-this.h)/collider.rad)); // of circle slice from the sphere at the collison y level
                            if(centerD<this.rad+circleRadius){
                                hit = true;
                                if(centerD<this.rad){
                                    this.yv=min(this.yv,0);
                                    this.y=collider.y-collider.rad-this.h;
                                    // might be bad if the player is stuck inside the underside of a sphere
                                }
                                else{
                                    var baseToContactPoint = vScale(vNormalize({x:collider.x-this.x,y:0,z:collider.z-this.z}),this.rad);
                                    var contactPoint = vAdd({x:this.x,y:this.y+this.h,z:this.z},baseToContactPoint);
                                    // update contact point to be on the surface of the sphere
                                    var outwardUnitVector = vNormalize(vSub(contactPoint,collider)); // unit vector
                                    // contactPoint = vAdd(collider,vScale(outwardUnitVector,collider.rad)); // 3d separation
                                    var outwardUnitVector2d = vNormalize({x:contactPoint.x-collider.x,y:0,z:contactPoint.z-collider.z}); contactPoint = vAdd({x:collider.x,y:contactPoint.y,z:collider.z},vScale(outwardUnitVector2d,circleRadius));// 2d separation is better for gameplay usually
                                    
                                    var newTop = vSub(contactPoint,baseToContactPoint); // top of the head
                                    this.x=newTop.x;
                                    this.y=newTop.y-this.h;
                                    this.z=newTop.z;
                                    if(collider.surfacePushFactor===undefined){
                                        collider.surfacePushFactor=1;
                                    }
                                    var pushStrength = max(0,this.yv)*collider.surfacePushFactor*0.6; // *0.6 because it's just wacky
                                    this.xv+=outwardUnitVector.x*pushStrength;
                                    this.yv=min(this.yv,0);
                                    this.zv+=outwardUnitVector.z*pushStrength;
                                }
                            }
                        }
                        else{
                            // hitting the equator of the sphere, acts like it's a cylinder with its equator circle
                            if(centerD<this.rad+collider.rad){
                                hit = true;
                                var outwardVector = vScale(vNormalize({x:this.x-collider.x,y:0,z:this.z-collider.z}),(this.rad+collider.rad));
                                this.x=collider.x+outwardVector.x;
                                this.z=collider.z+outwardVector.z;
                            }
                        }
                    }
                    break;
                case "slp":
                    if(vDotProduct(collider.planeNorm,{x:0,y:1,z:0})>=0){ // sideways or facing up
                        if(pointSideOfPlane(collider,vAnti(collider.planeNorm),{x:this.x,y:this.y,z:this.z})){
                            hit = true;
                            // is in the slope, so move out
                            var outPoint = pointCastOntoPlane(collider,vAnti(collider.planeNorm),{x:this.x,y:this.y,z:this.z});
                            this.x=outPoint.x;
                            this.y=outPoint.y;
                            this.z=outPoint.z;
                            
                            // handle velocity to be zero in the direction toward the floor while keeping the rest (...should be accurate)
                            var velocity = {x:this.xv,y:this.yv,z:this.zv};
                            var mag=vLength(velocity)*max(0,-vDotProduct(vNormalize(velocity),vNormalize(collider.planeNorm)));  // do nothing if the player's velocity is going away already. (set to 0 if negative)
                            velocity=vAdd(velocity,
                                vScale(
                                    vNormalize(collider.planeNorm),
                                    mag // representing how much of "velocity" aligns with the opposite of planeNorm (all shall be removed)
                                )
                            );
                            this.xv=velocity.x;
                            this.yv=velocity.y;
                            this.zv=velocity.z;
                            
                            collider.giveJumpFunc(this);
                        }
                    }
                break;
            }
        }
    }
    // does not care about previous coords
    return hit;
};
Oier.prototype.testDeath = function(){
    return(this.hp<=0);
};



var HeadParticle = function(x,y,z,headHeight,headAzimuth,headElevation,headTwist,headModel,spawnVelocity,lifetime,col,idTag){
    Oier.call(this,x,y-headHeight,z,headHeight,headHeight,0,headAzimuth,headElevation,headTwist,0.96,0.92,0.43,Infinity);
    this.headModel = headModel;
    this.col = col;
    this.prevx = x;
    this.prevz = z;
    this.xv = random(-spawnVelocity,spawnVelocity);
    this.yv = random(-spawnVelocity*0.2,spawnVelocity*1.4);
    this.zv = random(-spawnVelocity,spawnVelocity);
    this.timer = lifetime;
    this.lifetime = lifetime;
    if(idTag!==undefined){
        this.idTag = idTag;
    }
    //xyz from bodyFrame.eye
};
HeadParticle.prototype = Object.create(Oier.prototype);
HeadParticle.prototype.draw = function() {
    drawModel(this.headModel,this.x,this.y+this.h,this.z,this.h*0.55,this.h*0.66,this.h*0.55,this.azimuth,this.elevation,this.twist,this.col,true);
};
HeadParticle.prototype.exist = function(){
    this.drift();
    this.gravity(0.008);
    this.interactWithColliders();
    var xChange = this.x-this.prevx;
    var zChange = this.z-this.prevz;
    this.prevx = this.x;
    this.prevz = this.z;
    this.azimuth+=xChange*250;
    this.elevation+=zChange*250;
    this.draw();
    this.col[3] = map(constrain(this.timer,0,this.lifetime/10),0,this.lifetime/10,0,255);
    this.timer--;
    if(this.timer===0){
        this.hp = 0;
    }
};
var TorsoParticle = function(x,y,z,torsoHeight,azimuth,elevation,twist,spawnVelocity,lifetime,col,idTag){
    Oier.call(this,x,y-torsoHeight*0.6,z,torsoHeight*0.65,torsoHeight,0,azimuth,elevation,twist,0.96,0.92,0.43,Infinity);
    this.col = col;
    this.prevx = x;
    this.prevz = z;
    this.xv = random(-spawnVelocity,spawnVelocity);
    this.yv = random(-spawnVelocity*0.2,spawnVelocity);
    this.zv = random(-spawnVelocity,spawnVelocity);
    this.timer = lifetime;
    this.lifetime = lifetime;
    if(idTag!==undefined){
        this.idTag = idTag;
    }
    //xyz from bodyFrame.torsoCenter
};
TorsoParticle.prototype = Object.create(Oier.prototype);
TorsoParticle.prototype.draw = function() {
    drawModel(torsoModel,this.x,this.y+this.h*0.6,this.z,this.h*0.45,this.h*0.55,this.h*0.43,this.azimuth,this.elevation,this.twist,this.col,true);
};
TorsoParticle.prototype.exist = function(){
    this.drift();
    this.gravity(0.008);
    this.interactWithColliders();
    var posChange = dist(0,0,this.x-this.prevx,this.z-this.prevz);
    var xChange = this.x-this.prevx;
    var zChange = this.z-this.prevz;
    this.prevx = this.x;
    this.prevz = this.z;
    this.elevation+=xChange*150;
    this.azimuth+=zChange*150;
    this.draw();
    this.col[3] = map(constrain(this.timer,0,this.lifetime/10),0,this.lifetime/10,0,255);
    this.timer--;
    if(this.timer===0){
        this.hp = 0;
    }
};
var ArmParticle = function(x,y,z,relativeShoulder,relativeElbow,relativeHand,azimuth,elevation,twist,spawnVelocity,lifetime,col,idTag){
    var semiLength = vLength(vSub(relativeShoulder,relativeElbow));
    var superRad = max(max(vLength(relativeShoulder),vLength(relativeElbow)),vLength(relativeHand));
    Oier.call(this,x,y-semiLength*0.5,z,superRad,semiLength*0.5,0,azimuth,elevation,twist,0.96,0.92,0.43,Infinity);
    this.col = col;
    this.semiLength = semiLength;
    this.superRad = superRad;
    this.prevx = x;
    this.prevz = z;
    this.xv = random(-spawnVelocity,spawnVelocity);
    this.yv = random(-spawnVelocity*0.2,spawnVelocity*0.5);
    this.zv = random(-spawnVelocity,spawnVelocity);
    this.timer = lifetime;
    this.lifetime = lifetime;
    this.shoulder = relativeShoulder;
    this.elbow = relativeElbow;
    this.hand = relativeHand;
    if(idTag!==undefined){
        this.idTag = idTag;
    }
};
ArmParticle.prototype = Object.create(Oier.prototype);
ArmParticle.prototype.draw = function() {
    var mid = pCopy(this);
    mid.y+=this.semiLength*0.5;
    var shoulder = pCopy(this.shoulder);
    var elbow = pCopy(this.elbow);
    var hand = pCopy(this.hand);
    angRotatePointTEA(shoulder,origin,this.azimuth,this.elevation,this.twist);
    angRotatePointTEA(elbow,origin,this.azimuth,this.elevation,this.twist);
    angRotatePointTEA(hand,origin,this.azimuth,this.elevation,this.twist);
    drawArm(vAdd(mid,shoulder),vAdd(mid,elbow),vAdd(mid,hand),this.col,true);
};
ArmParticle.prototype.exist = function(){
    this.drift();
    this.gravity(0.008);
    this.interactWithColliders();
    var posChange = dist(0,0,this.x-this.prevx,this.z-this.prevz);
    var xChange = this.x-this.prevx;
    var zChange = this.z-this.prevz;
    this.prevx = this.x;
    this.prevz = this.z;
    this.elevation-=xChange*150;
    this.azimuth+=zChange*150;
    this.draw();
    this.col[3] = map(constrain(this.timer,0,this.lifetime/10),0,this.lifetime/10,0,255);
    this.timer--;
    if(this.timer===0){
        this.hp = 0;
    }
};
var LegParticle = function(x,y,z,relativeHip,relativeKnee,relativeFoot,azimuth,elevation,twist,spawnVelocity,lifetime,col,idTag){
    var semiLength = vLength(vSub(relativeHip,relativeKnee));
    var superRad = max(max(vLength(relativeHip),vLength(relativeKnee)),vLength(relativeFoot));
    Oier.call(this,x,y-semiLength*0.5,z,superRad,semiLength*0.5,0,azimuth,elevation,twist,0.96,0.92,0.43,Infinity);
    this.col = col;
    this.semiLength = semiLength;
    this.superRad = superRad;
    this.prevx = x;
    this.prevz = z;
    this.xv = random(-spawnVelocity,spawnVelocity);
    this.yv = random(-spawnVelocity*0.5,spawnVelocity*0.5);
    this.zv = random(-spawnVelocity,spawnVelocity);
    this.timer = lifetime;
    this.lifetime = lifetime;
    this.hip = relativeHip;
    this.knee = relativeKnee;
    this.foot = relativeFoot;
    if(idTag!==undefined){
        this.idTag = idTag;
    }
};
LegParticle.prototype = Object.create(Oier.prototype);
LegParticle.prototype.draw = function() {
    var mid = pCopy(this);
    mid.y+=this.semiLength*0.5;
    var hip = pCopy(this.hip);
    var knee = pCopy(this.knee);
    var foot = pCopy(this.foot);
    angRotatePointTEA(hip,origin,this.azimuth,this.elevation,this.twist);
    angRotatePointTEA(knee,origin,this.azimuth,this.elevation,this.twist);
    angRotatePointTEA(foot,origin,this.azimuth,this.elevation,this.twist);
    drawArm(vAdd(mid,hip),vAdd(mid,knee),vAdd(mid,foot),this.col,true);
};
LegParticle.prototype.exist = function(){
    this.drift();
    this.gravity(0.008);
    this.interactWithColliders();
    var posChange = dist(0,0,this.x-this.prevx,this.z-this.prevz);
    var xChange = this.x-this.prevx;
    var zChange = this.z-this.prevz;
    this.prevx = this.x;
    this.prevz = this.z;
    this.elevation+=xChange*150;
    this.azimuth-=zChange*150;
    this.draw();
    this.col[3] = map(constrain(this.timer,0,this.lifetime/10),0,this.lifetime/10,0,255);
    this.timer--;
    if(this.timer===0){
        this.hp = 0;
    }
};

var bodyFrameUArgsGenerators = {
    stand:function(t,azimuth){
        return [
            0,0,0,0,
            0,0,0,0,
            azimuth,0,0,0,0
        ];
    },
    demoDance:function(t,azimuth,mag,armAzimuth){
        return [
            270,-80-60*cos(t*720),-105-45*cos(t*720),-70,
            -270,-80-60*cos(t*720),105+45*cos(t*720),-70,
            azimuth,0,15*sin(t*360),0,65*cos(t*720)
        ];
    },
    lift:function(t,azimuth){
        return [
            25,45+7*sin(t*360),-30,60,
            -25,45+7*sin(t*360),30,60,
            azimuth,0,0,0,0
        ];
    },
    clap:function(t,azimuth){
        return [
            10+8*sin(t*1800),44-5*sin(t*1800),-45-min(11,-22*sin(t*1800)),75+5*sin(t*1800),
            -10-8*sin(t*1800),44-5*sin(t*1800),45+min(11,-22*sin(t*1800)),75+5*sin(t*1800),
            azimuth,0,0,constrain(22*sin(t*360),-13,13),7*cos(t*720)
        ];
    },
    swirl:function(t,azimuth){
        return [
            90,150,0,0,
            270,150,0,0,
            azimuth,20*cos(t*360),20*sin(t*360),90*cos(t*720),-20*sin(t*360)
        ];
    },
    salute:function(t,azimuth){
        return [
            0,0,0,0,
            map(t,0,1,0,-40),map(t,0,1,0,120),map(t,0,1,0,130),map(t,0,1,0,-10),
            azimuth,0,0,0,map(t,0,1,-20,5)
        ];
        // -40,120,130,-10,
        // azimuth,0,0,0,0
    },
    crossArms:function(t,azimuth){
        return [
            -15,50,-95,32,
            15,50,95,44,
            0,0,0,20*sin(t*360),-13
        ];
    },
    disapproval:function(t,azimuth){
        return [
            -15,50,-95,32,
            15,50,95,44,
            0,8,0,15*sin(t*720),-13
        ];
    },
    zombie:function(t,azimuth){
        return [
            25,70+10*sin(t*360),-30-8*cos(t*360),0,
            -25,70+10*cos(t*360),30-8*sin(t*360),0,
            azimuth,0,0,0,0
        ];
    },
    run:function(t,azimuth,mag,forwardness,sidewaysness){
        var armAzimuth = constrain(mag,0,9);
        return [
            -armAzimuth,(-0.18+sin(t*360+180))*6*mag,-armAzimuth,4*mag*(1.72+sin(t*360+190)),
            armAzimuth,(-0.18+sin(t*360))*6*mag,armAzimuth,4*mag*(1.72+sin(t*360+10)),
            azimuth,-1.4*(forwardness||0),-(sidewaysness||0)*0.5,0,1.4*(forwardness||0)
        ];
    },
    // holdSmallGunTwoHands:function(t,azimuth,elevation){
    //     // var target = {x:0,y:0,z:holdDistance};
    //     // angRotatePointTEA(target,origin,azimuth,elevation,0);
        
    //     // var e = constrain(elevation*1.2,-40,55);
    //     var e = elevation*1.2;
    //     return [
    //         -22-min(pow(abs(e),1.5/25),10),80+e*0.7,0,25,
    //         22+min(pow(abs(e),1.5/25),10),80+e*0.7,0,25,
    //         azimuth,0,0,0,elevation
    //     ];
    // }
};
var bodyFrameLArgsGenerators = {
    stand:function(t){
        return [
            0,0,0,0,
            0,0,0,0
        ];
    },
    run:function(t,mag){
        return [
            0,(0.25+sin(t*360))*7*mag,0,6*mag*(-0.75-sin(t*360+80)),
            0,(0.25-sin(t*360))*7*mag,0,6*mag*(-0.75+sin(t*360+80))
        ];
    }
};
var bodyFrameModifiers = {
    reach:function(bodyFrame, point){
        {
            var dir = vNormalize(vSub(point,bodyFrame.rightShoulder));
            var upperLength = vLength(vSub(bodyFrame.rightShoulder,bodyFrame.rightElbow));
            var lowerLength = vLength(vSub(bodyFrame.rightElbow,bodyFrame.rightHand));
            bodyFrame.rightElbow = vAdd(bodyFrame.rightShoulder,vScale(dir,upperLength));
            bodyFrame.rightElbow.y-=0.001;
            bodyFrame.rightHand = vAdd(bodyFrame.rightShoulder,vScale(dir,upperLength+lowerLength));
        }
        {
            var dir = vNormalize(vSub(point,bodyFrame.leftShoulder));
            var upperLength = vLength(vSub(bodyFrame.leftShoulder,bodyFrame.leftElbow));
            var lowerLength = vLength(vSub(bodyFrame.leftElbow,bodyFrame.leftHand));
            bodyFrame.leftElbow = vAdd(bodyFrame.leftShoulder,vScale(dir,upperLength));
            bodyFrame.leftElbow.y-=0.001;
            bodyFrame.leftHand = vAdd(bodyFrame.leftShoulder,vScale(dir,upperLength+lowerLength));
        }
        return vScale(vAdd(bodyFrame.leftHand,bodyFrame.rightHand),1/2);
    }
        // azimuth:azimuth,
        // elevation:elevation,
        // twist:twist,
        // facingFocus:facingFocus,
        // root:root,
        // eye:eye,
        // neckBase:neckBase,
        // leftShoulder:leftShoulder,
        // rightShoulder:rightShoulder,
        // leftElbow:leftElbow,
        // rightElbow:rightElbow,
        // leftHand:leftHand,
        // rightHand:rightHand,
        // crotchPoint:crotchPoint,
        // leftHip:leftHip,
        // rightHip:rightHip,
        // leftKnee:leftKnee,
        // rightKnee:rightKnee,
        // leftFoot:leftFoot,
        // rightFoot:rightFoot,
};

// x,y,z,rad,h,eyeLevel,azimuth,elevation,twist,airFrictionFactor,groundFrictionFactor,airAccelerationFactor,hp
var Mannequin = function(x,y,z,bodyScale,azimuth,elevation,twist,bodyCols,hp,onStart,whileRunning,onEnd){
    Oier.call(this,x,y,z,bodyScale*0.5/0.7,bodyScale*2.2/0.7,bodyScale*2.1/0.7,azimuth,elevation,twist,0.88,0.86,0.43,hp);
    this.bodyScale = bodyScale; // 0.7, rad h eyelevel are already determined based off the initial value, you'd have to change them manually if you want to change their size as a physical object
    this.bodyCols = bodyCols;
    this.bodyFrame = angGenerateBodyFrame(
        x,y+this.eyeLevel,z,
        azimuth,elevation,twist,   0,0,
        bodyScale*0.45,bodyScale*1,bodyScale*1.3,bodyScale*1.5,bodyScale*0.45,bodyScale*1.5,
        0,0,0,0,
        0,0,0,0,
        0,0,0,0,
        0,0,0,0
    );
    this.onStart = onStart||0;
    this.whileRunning = whileRunning||0;
    this.onEnd = onEnd||0;
};
Mannequin.prototype = Object.create(Oier.prototype);
Mannequin.prototype.draw = function() {
    drawBody(this.bodyFrame,this.bodyCols,0);
};
Mannequin.prototype.makeCollider = function() {
    colliders.push({
        idTag:this.idTag,
        type:"cyl",
        x:this.x, y:this.y+this.eyeLevel*0.54, z:this.z,
        prevx:this.x, prevy:this.y+this.eyeLevel*0.54, prevz:this.z,
        h:this.eyeLevel*0.54,
        rad:this.bodyScale*0.42,
        giveJumpFunc:giveJump
    });
};
Mannequin.prototype.exist = function(){
    if(this.whileRunning!==0){
        this.whileRunning();
    }
    this.drift();
    this.canJump--;
    if(this.canJump<0.0001){this.canJump=0;}
    this.interactWithColliders();
    this.gravity(0.015);
    this.draw();
};
Mannequin.prototype.makeBodyParticles = function(){
    var bodyFrame = this.bodyFrame;
    var torsoCenter = midPoint(bodyFrame.crotchPoint,bodyFrame.neckBase);
    var torsoHeight = distPointToPoint(bodyFrame.crotchPoint,bodyFrame.neckBase);
    var headHeight = distPointToPoint(bodyFrame.neckBase,bodyFrame.root)*1.05;
    var defaultAuxVec = {
        x:bodyFrame.facingFocus.z-bodyFrame.eye.z,
        y:0,
        z:bodyFrame.eye.x-bodyFrame.facingFocus.x,
    };
    var finalAuxVec = threePointNormal({
        v1:bodyFrame.facingFocus,
        v2:bodyFrame.neckBase,
        v3:bodyFrame.eye
    });
    var headTwist = angBetweenVectors(defaultAuxVec,finalAuxVec);
    var headElevation = elevationBetween(bodyFrame.eye,bodyFrame.facingFocus);
    var headAzimuth = azimuthBetween(bodyFrame.eye,bodyFrame.facingFocus);
    if(finalAuxVec.y<0){headTwist*=-1;}
    
    var bodyParticleLifeTime = 720;
    var bodyParticleSpawnVelocity = 0.03;
    oiers.push(HeadParticle.new(bodyFrame.eye.x,bodyFrame.eye.y,bodyFrame.eye.z,headHeight,headAzimuth,headElevation,headTwist,monitorHeadModel,bodyParticleSpawnVelocity,bodyParticleLifeTime,this.bodyCols[0],this.idTag));
    oiers.push(TorsoParticle.new(torsoCenter.x,torsoCenter.y,torsoCenter.z,torsoHeight,bodyFrame.azimuth,bodyFrame.elevation,bodyFrame.twist,bodyParticleSpawnVelocity,bodyParticleLifeTime,this.bodyCols[1],this.idTag));
    var leftArmCenter = vScale(vAdd(vAdd(bodyFrame.leftShoulder,bodyFrame.leftElbow),bodyFrame.leftHand),1/3);
    oiers.push(ArmParticle.new(leftArmCenter.x,leftArmCenter.y,leftArmCenter.z,vSub(bodyFrame.leftShoulder,leftArmCenter),vSub(bodyFrame.leftElbow,leftArmCenter),vSub(bodyFrame.leftHand,leftArmCenter),0,0,0,bodyParticleSpawnVelocity,bodyParticleLifeTime,this.bodyCols[2],this.idTag));
    var rightArmCenter = vScale(vAdd(vAdd(bodyFrame.rightShoulder,bodyFrame.rightElbow),bodyFrame.rightHand),1/3);
    oiers.push(ArmParticle.new(rightArmCenter.x,rightArmCenter.y,rightArmCenter.z,vSub(bodyFrame.rightShoulder,rightArmCenter),vSub(bodyFrame.rightElbow,rightArmCenter),vSub(bodyFrame.rightHand,rightArmCenter),0,0,0,bodyParticleSpawnVelocity,bodyParticleLifeTime,this.bodyCols[3],this.idTag));
    var leftLegCenter = vScale(vAdd(vAdd(bodyFrame.leftHip,bodyFrame.leftKnee),bodyFrame.leftFoot),1/3);
    oiers.push(ArmParticle.new(leftLegCenter.x,leftLegCenter.y,leftLegCenter.z,vSub(bodyFrame.leftHip,leftLegCenter),vSub(bodyFrame.leftKnee,leftLegCenter),vSub(bodyFrame.leftFoot,leftLegCenter),0,0,0,bodyParticleSpawnVelocity,bodyParticleLifeTime,this.bodyCols[4],this.idTag));
    var rightLegCenter = vScale(vAdd(vAdd(bodyFrame.rightHip,bodyFrame.rightKnee),bodyFrame.rightFoot),1/3);
    oiers.push(ArmParticle.new(rightLegCenter.x,rightLegCenter.y,rightLegCenter.z,vSub(bodyFrame.rightHip,rightLegCenter),vSub(bodyFrame.rightKnee,rightLegCenter),vSub(bodyFrame.rightFoot,rightLegCenter),0,0,0,bodyParticleSpawnVelocity,bodyParticleLifeTime,this.bodyCols[5],this.idTag));
};
Mannequin.prototype.testDeath = function(){
    if(this.hp<=0){
        this.makeBodyParticles();
        return true;
    }
    else{
        return false;
    }
};
var makeMannequinClone = function(og){
    var cl = oCopy(og);
    cl.idTag = floor(random(0,1e18));
    return cl;
};

var Limb = function(root,end,segData,targetTime,yLift){
    this.root = pCopy(root);
    this.end = pCopy(end);

    this.endTarget = pCopy(end);
    this.endTransition = pCopy(end);
    this.targetTimer = 0;
    this.targetTime = targetTime; // constant

    this.yLift = yLift;
    this.segs = oCopy(segData); // [{l,h,w,col},{l,h,w,col}, ...]
    this.joints = [];
    for(let i = 0; i<=segData.length; i++){
        this.joints.push(vAdd(root,vScale(vSub(end,root),i/segData.length)));
    }
};
Limb.prototype.inverseKinematicsReach = function(pt,endFirst,allowShort){
    if(allowShort===undefined){
        allowShort = false;
    }
    for(let i = (this.joints.length-1)*endFirst; i<this.joints.length&&i>=0; i+=1-2*endFirst){
        let j = i-(1-2*endFirst);
        if(j<0||j>=this.joints.length){
            this.joints[i] = pCopy(pt);
        }
        else{
            let l = this.segs[min(i,j)].l;
            if((!allowShort)||distPointToPoint(this.joints[i],this.joints[j])>l){
                this.joints[i] = vAdd(this.joints[j],vScale(vNormalize(vSub(this.joints[i],this.joints[j])),l));
            }
        }
    }
}
Limb.prototype.fabrik = function(){
    let iters = 10;
    for(let i = 0; i<iters; i++){
        this.inverseKinematicsReach(this.end,1);
        this.inverseKinematicsReach(this.root,0);
    }
}
Limb.prototype.drawDebug = function(){
    if(drawDot({x:this.end.x,y:this.end.y,z:this.end.z,rad:0.16,renderType:"circle",col:[255,0,0]})){
        graphics[graphics.length-1].depth = 1e-5;
    }
    if(drawDot({x:this.root.x,y:this.root.y,z:this.root.z,rad:0.16,renderType:"circle",col:[0,0,255]})){
        graphics[graphics.length-1].depth = 1e-5;
    }
    for(let i = 0; i<this.joints.length; i++){
        if(drawDot({x:this.joints[i].x,y:this.joints[i].y,z:this.joints[i].z,rad:0.1,renderType:"circle",col:[255,0,255]})){
            graphics[graphics.length-1].depth = 1e-6;
        }
    }
    // oPrint(this);
    // console.log(this.end)
}
Limb.prototype.draw = function(){
    for(let i = 0; i<this.segs.length; i++){
        let mid = vScale(vAdd(this.joints[i],this.joints[i+1]),0.5);
        let azimuth = azimuthBetween(this.joints[i],this.joints[i+1]); // or maybe just part of the leg, overwritten by the creature so it doesn't "bend backwards"...?
        let elevation = elevationBetween(this.joints[i],this.joints[i+1]);
        drawModel(cubeModel,mid.x,mid.y,mid.z,this.segs[i].w/2,this.segs[i].h/2,this.segs[i].l/2,azimuth,elevation,0,this.segs[i].col,true);
    }
}
Limb.prototype.setTarget = function(pt){
    this.endTarget = pCopy(pt);
    this.targetTimer = this.targetTime;
    // console.log(this.endTarget)
}
Limb.prototype.operate = function(){
    this.fabrik();

    this.targetTimer = round(this.targetTimer); // discrete number of steps left to take
    if(this.targetTimer>0){
        this.endTransition = vAdd(this.endTransition,vScale(vSub(this.endTarget,this.endTransition),1/this.targetTimer));
        this.end = this.endTransition;
        this.end.y += this.yLift*sin(this.targetTimer/this.targetTime*180);
        this.targetTimer--;
    }
}

var WarWalker = function(x,y,z,azimuth,limbSegSettings){
    Oier.call(this,x,y,z,2.2,0.4,5,azimuth,0,0,0.85,0.85,1,1000);
    this.comfyRad = 3.65;
    this.stepRandomness = 0.4;

    this.prevx = x;
    this.prevy = y;
    this.prevz = z;

    this.legCentralism = 0;
    this.legCentralismTimer = 0;

    this.limbs = [];
    this.altitude = 3.1;
    let segSettings;
    if(limbSegSettings===undefined||limbSegSettings.length===0){
        segSettings = [
            {l:1.25,h:0.7,w:0.7,col:[130,130,160]},
            {l:1.15,h:0.5,w:0.5,col:[200,200,230]},
            {l:1.15,h:0.5,w:0.5,col:[200,200,230]},
            {l:0.7,h:0.9,w:0.9,col:[130,130,160]},
        ];
    }
    else{
        segSettings = limbSegSettings;
    }
    for(let i = 0; i<3; i++){
    
        let root = {x:cos(i*120)*this.rad,y:0,z:sin(i*120)*this.rad};
        angRotatePointEAT(root,origin,this.azimuth,this.elevation,0);
        root = vAdd(this,root);

        let xzDst = dist(root.x,root.z,this.x,this.z)+1e-4; // don't divide 0
        let comfy = vAdd(this,vScale(vSub(root,this),this.comfyRad/xzDst));
        comfy.y = this.y - this.altitude;
            
        this.limbs.push(Limb.new(
            root,
            comfy,
            segSettings,
            9,
            0.3
        ));
    }

    this.path = [];
    this.pathBoringTimer = 0;

    this.azimuthTarget = azimuth;
}
WarWalker.prototype = Object.create(Oier.prototype);
WarWalker.prototype.operate = function(){
    this.azimuthTarget = anyModulo(this.azimuthTarget,360);
    this.azimuth = anyModulo(this.azimuth,360);
    if(abs(this.azimuth-this.azimuthTarget)<=3){
        this.azimuth = this.azimuthTarget;
    }
    else{
        this.azimuth = angTo(this.azimuth,this.azimuthTarget,3);
    }
    
    for(let i = 0; i<3; i++){
        let root = {x:cos(i*120)*this.rad,y:0,z:sin(i*120)*this.rad};
        angRotatePointEAT(root,origin,this.azimuth,this.elevation,0);
        root = vAdd(this,root);

        let xzDst = dist(root.x,root.z,this.x,this.z)+1e-4; // don't divide 0
        let comfy = vAdd(this,vScale(vSub(root,this),this.comfyRad/xzDst));
        comfy.y = this.y - this.altitude;

        this.limbs[i].root = root;
            // console.log(distPointToPoint(this.limbs[i].end,comfy))
            // oPrint(this.limbs[i].end)
            // oPrint(comfy)

        let homeMetric = {x:(comfy.x+this.x*this.legCentralism)/(1+this.legCentralism),y:comfy.y,z:(comfy.z+this.z*this.legCentralism)/(1+this.legCentralism)}
        let maxRad = 1.9+1.8*this.legCentralism;
        if(distPointToPoint(this.limbs[i].end,homeMetric)>maxRad){
            let dirVec = vSub(homeMetric,this.limbs[i].end);
            let sf = random(0.92,0.98)*maxRad/vLength(dirVec);
            this.limbs[i].setTarget(vAdd(homeMetric,vScale(dirVec,sf)))
        }
    }
    
    for(let limb of this.limbs){
        limb.operate();
    }

    this.legCentralismTimer--;
    if(this.legCentralismTimer<0){
        this.legCentralismTimer = 0;
        this.legCentralism=0;
    }
    if(this.y>this.altitude){
        this.y-=min(1,(this.y-this.altitude)*0.3);
    }
    else if(this.y<this.altitude){
        this.y+=min(0.8,(this.altitude-this.y)*0.3);
    }
}
WarWalker.prototype.operateDebug = function(){
    var t = this;
    if(inp[73]){
        t.z+=0.17;
    }
    if(inp[74]){
        t.x-=0.17;
    }
    if(inp[75]){
        t.z-=0.17;
    }
    if(inp[76]){
        t.x+=0.17;
    }
    if(inp[79]){
        t.azimuth+=3.5;
    }
    if(inp[85]){
        t.azimuth-=3.5;
    }
    if(inp[188]){
        t.y+=2;
    }
}
WarWalker.prototype.nature = function(){
    if(dist(this.prevx,this.prevz,this.x,this.z)>0.01){
        this.legCentralism = 1;
        this.legCentralismTimer = 10;
    }
    this.prevx = this.x;
    this.prevy = this.y;
    this.prevz = this.z;
}
WarWalker.prototype.draw = function(){
    for(let limb of this.limbs){
        limb.draw();
    }

    let maxDepth = -1;
    if(drawModel(
        cubeModel,
        this.x+this.rad*0.475*cos(this.azimuth+90),
        this.y+1.1+this.rad*0.6,
        this.z+this.rad*0.475*sin(this.azimuth+90),
        1.5,0.25,0.25,
        this.azimuth+90,this.elevation,0,[80,80,110],true
    )){maxDepth = max(maxDepth,graphics[graphics.length-1].depth)}
    if(drawModel(
        cubeModel,
        this.x+this.rad*0.475*cos(this.azimuth+90)+this.rad*0.5*cos(this.azimuth+180),
        this.y+1.1+this.rad*0.6,
        this.z+this.rad*0.475*sin(this.azimuth+90)+this.rad*0.5*sin(this.azimuth+180),
        1.5,0.25,0.25,
        this.azimuth+90,this.elevation,0,[80,80,110],true
    )){maxDepth = max(maxDepth,graphics[graphics.length-1].depth)}
    if(drawModel(
        cubeModel,
        this.x+this.rad*0.475*cos(this.azimuth+90)+this.rad*0.5*cos(this.azimuth),
        this.y+1.1+this.rad*0.6,
        this.z+this.rad*0.475*sin(this.azimuth+90)+this.rad*0.5*sin(this.azimuth),
        1.5,0.25,0.25,
        this.azimuth+90,this.elevation,0,[80,80,110],true
    )){maxDepth = max(maxDepth,graphics[graphics.length-1].depth)}
    
    if(drawModel(
        hexaCylinderModel,
        this.x,this.y-0.15,this.z,
        this.rad*0.99,0.65,this.rad*0.99,
        this.azimuth,this.elevation,0,[130,130,160],true
    )){
        if(maxDepth!==-1&&c.y>this.y+3+this.rad*0.6){
            graphics[graphics.length-1].depth = max(graphics[graphics.length-1].depth,maxDepth+3e-6);
        }
    }
    if(drawModel(
        hexaCylinderModel,
        this.x,this.y+0.75,this.z,
        this.rad*0.45,0.25,this.rad*0.45,
        this.azimuth,this.elevation,0,[130,130,160],true
    )){
        if(maxDepth!==-1&&c.y>this.y+3+this.rad*0.6){
            graphics[graphics.length-1].depth = max(graphics[graphics.length-1].depth,maxDepth+2e-6);
        }
    }

    drawModel(
        arcadeHeadTopModel,
        this.x-this.rad*0.2*cos(this.azimuth+90),
        this.y+1+this.rad*0.6,
        this.z-this.rad*0.2*sin(this.azimuth+90),
        this.rad*0.8,this.rad*0.6,this.rad*0.7,
        this.azimuth+90,this.elevation,0,[130,130,160],true
    );
    if(drawModel(
        arcadeHeadMiddleModel,
        this.x-this.rad*0.2*cos(this.azimuth+90),
        this.y+1+this.rad*0.6,
        this.z-this.rad*0.2*sin(this.azimuth+90),
        this.rad*0.8,this.rad*0.6,this.rad*0.7,
        this.azimuth+90,this.elevation,0,[255,175,75],true
    )){
        // this.azimuth = azimuthBetween(this,c);
        let angDif = (azimuthBetween(this,c)+360)%360 - this.azimuth%360;
        if(angDif>180){
            angDif-=360;
        }
        if(angDif<-180){
            angDif+=360;
        }
        if(abs(angDif)<90){
            graphics[graphics.length-1].depth = max(graphics[graphics.length-1].depth,maxDepth+1e-6);
        }
    }
    if(drawModel(
        arcadeHeadBottomModel,
        this.x-this.rad*0.2*cos(this.azimuth+90),
        this.y+1+this.rad*0.6,
        this.z-this.rad*0.2*sin(this.azimuth+90),
        this.rad*0.8,this.rad*0.6,this.rad*0.7,
        this.azimuth+90,this.elevation,0,[130,130,160],true
    )){
        if(maxDepth!==-1&&c.y>this.y+3+this.rad*0.6){
            graphics[graphics.length-1].depth = max(graphics[graphics.length-1].depth,maxDepth+1e-6);
        }
    }
}
WarWalker.prototype.makeCollider = function(){
    let thisww = this;
    let yOff = 2.1;
    colliders.push({idTag:-1,
        type:"box",
        x:this.x, y:this.y+yOff, z:this.z,
        prevx:this.prevx, prevy:this.prevy+yOff, prevz:this.prevz,
        l:this.rad*0.8, h:this.h, w:this.rad*1.1,
        azimuth:this.azimuth,
        giveJumpFunc:function(oier){
            giveJump(oier);
            if(oier.standingOnWarWalker===false||oier.standingOnWarWalker===undefined){
                oier.standingOnWarWalker = thisww;
            }
            else{
                // console.log(dist(oier.x,oier.z,this.x,this.z));
                // console.log(dist(oier.x,oier.z,oier.standingOnWarWalker.x,oier.standingOnWarWalker.z));
                if(dist(oier.x,oier.z,this.x,this.z)<dist(oier.x,oier.z,oier.standingOnWarWalker.x,oier.standingOnWarWalker.z)){
                    oier.standingOnWarWalker = thisww;
                    // console.log("won");
                }
                else{
                    // console.log("lost");
                }
            }
        }
    });
}
WarWalker.prototype.friend = function(){
    if(dist(player.x,player.z,this.x,this.z)<2.4||player.standingOnWarWalker===this){
        if(player.y<this.y){
            player.y = this.y+2.11+this.h;
            player.x = this.x;
            player.z = this.z;
        }

        if(player.standingOnWarWalker===this){
            this.path = [];
            this.azimuthTarget = player.azimuth;
            this.x += (player.x+player.xv-this.x)*0.1;
            this.z += (player.z+player.zv-this.z)*0.1;
            player.standingOnWarWalker = false;
        }
        
    }
}
WarWalker.prototype.followPath = function(){
    if(this.pathBoringTimer>=100){
        this.path = [];
        this.pathBoringTimer = 0;
    }
    // console.log(this.path.length);
    if(this.path.length===0){
        this.pathBoringTimer = 0;
        return;
    }
    this.pathBoringTimer++;
    let next = this.path[this.path.length-1];
    next.y = this.y;
    let dirVec = vScale(vNormalize(vSub(next,this)),0.15);
    this.x += dirVec.x;
    this.z += dirVec.z;
    if(random(0,25)<1){
        this.azimuthTarget = azimuthBetween(this,this.path[floor(random(0,this.path.length))]);
    }
    if(dist(this.x,this.z,next.x,next.z)<1){
        this.path.pop();
        this.pathBoringTimer = 0;
    }
}



var PlatformFairy = function(x,y,z,azimuth,hp,col){
    //x,y,z,rad,h,eyeLevel,azimuth,elevation,twist,airFrictionFactor,groundFrictionFactor,airAccelerationFactor,hp
    Oier.call(this,x,y,z,1.7,1.7,0,azimuth,0,0,0.88,0.88,1,hp);
    this.azimuthv = 0;
    this.cd = floor(random(0,20));
    this.seed = random(0,360);
    this.col = col;
    this.type = "PlatformFairy";
};
PlatformFairy.prototype = Object.create(Oier.prototype);
PlatformFairy.prototype.exist = function(){
    this.cd--;
    this.y+=0.01;
    this.x+=this.xv;
    this.z+=this.zv;
    this.xv*=0.93;
    this.zv*=0.93;
    this.xv+=cos(this.azimuth)*0.015;
    this.zv+=sin(this.azimuth)*0.015;
    var frenziness = 1+0.8*sin(ganime);
    this.azimuthv+=random(-frenziness,frenziness)+0.015*(1-2*(this.seed>180));
    this.azimuthv*=0.95;
    this.azimuth+=this.azimuthv;
    if(dist(this.x,this.z,0,0)>45){
        var backang = 180+atan2(this.z,this.x);
        // this.xv+=cos(backang)*0.05;
        // this.zv+=sin(backang)*0.05;
        for(var j = 0; j<8; j++){
            this.azimuth = angTo(this.azimuth,backang,1);
        }
    }
    if(this.cd<=0){
        var nx = this.x;
        var ny = this.y;
        var nz = this.z;
        for(var i = 0; i<solids.length; i++){
            if(solids[i].constructor.name==="Disc"){
                var d = dist(nx,nz,solids[i].x,solids[i].z);
                if(d<this.rad*2){
                    var outAng = atan2(nz-solids[i].z,nx-solids[i].x);
                    nx+=(this.rad*2-d)*cos(outAng);
                    nz+=(this.rad*2-d)*sin(outAng);
                }
            }
        }
        if(dist(nx,nz,this.x,this.z)<2.8*this.rad){
            var canGenerate = true;
            for(var i = 0; i<solids.length; i++){
                if(solids[i].constructor.name==="Disc"){
                    if(dist(nx,nz,solids[i].x,solids[i].z)<this.rad){
                        canGenerate = false;
                        break;
                    }
                }
            }
            if(canGenerate){
                this.cd = 36;
                solids.push(Disc.new(nx,ny,nz,this.rad,0.3,0,this.col));
                if(random(0,3)<1){
                    this.hp-=random(0,8);
                }
                else if(random(0,20+30*(dist(player.x+player.xv*10,player.z+player.zv*10,this.x,this.z)<15))<1){
                    items.push(Boost.new(nx,ny+2,nz));
                }
                else if(random(0,30)<1){
                    items.push(Coin.new(nx,ny+25,nz));
                }
            }
        }
    }
};
PlatformFairy.prototype.draw = function(){
    drawModel(icosahedronModel,this.x,this.y,this.z,this.rad*0.95,this.rad*0.95,this.rad*0.95,ganime*3,ganime*4,ganime*5,[255,255,255],false);
    createLightSource(this.x,this.y,this.z,1,9,2,0);
    drawGameBar(this.x,this.y+this.rad+0.5,this.z,1.5,this.hp/this.stats.hp);
};
var Bullet = function(x,y,z,rad,azimuth,elevation,speed,damage,collisionGenerosity,lifetime,idTag){
    Oier.call(this,x,y,z,rad,rad,0,azimuth,elevation,0,0,0,0,Infinity);
    var vec = vScale(angsToVector(azimuth,elevation),speed);
    this.xv = vec.x;
    this.yv = vec.y;
    this.zv = vec.z;
    this.damage = damage;
    this.idTag = idTag;
    this.collisionGenerosity = collisionGenerosity;
    this.timer = lifetime;
};
Bullet.prototype = Object.create(Oier.prototype);
Bullet.prototype.draw = function() {
    drawModel(octahedronModel,this.x,this.y,this.z,this.rad,this.rad,this.rad,random(0,360),random(0,360),0,[150,150,150],true);
};
Bullet.prototype.travel = function(distance){
    var travelVector;
    if(distance===undefined){
        travelVector = velocityToVector(this);
    }
    else{
        travelVector = vScale(vNormalize(velocityToVector(this)),distance);
    }
    var stepCount = min(ceil(vLength(travelVector)/0.3),500);
    for(var step = 0; step<stepCount; step++){
        this.x+=travelVector.x/stepCount;
        this.y+=travelVector.y/stepCount;
        this.z+=travelVector.z/stepCount;
        for(var i = 0; i<mannequins.length; i++){
            if(mannequins[i].idTag!==this.idTag){
                if(dist(this.x,this.z,mannequins[i].x,mannequins[i].z)<mannequins[i].bodyScale*0.4+this.collisionGenerosity && this.y>mannequins[i].y-mannequins[i].eyeLevel-this.collisionGenerosity/2 && this.y<mannequins[i].y+mannequins[i].eyeLevel*1.08+this.collisionGenerosity/2){
                    mannequins[i].hp-=this.damage;
                    this.hp=0;
                    return;
                }
            }
        }
        if(this.interactWithColliders()){
            this.hp = 0;
            return;
        }
    }
};
Bullet.prototype.exist = function(){
    var lengthToTravel = 1;
    while(lengthToTravel>0){
        var segSize = min(lengthToTravel,random(0.15,0.3));
        this.travel(velocityLength(this)*segSize);
        if(this.hp<=0){
            return;
        }
        this.draw();
        lengthToTravel-=segSize;
    }
    if(vLength(vSub(this,player))>1e3&&vLength(vSub(this,c))>1e3){
        this.hp = 0;
        return;
    }
    this.timer--;
    if(this.timer<=0){
        this.hp=0;
    }
};
var Boid = function(x,y,z,azimuth,elevation){
    // Oier.call(this,x,y,z,1,1,0,azimuth,elevation,0,0.88,0.88,1,1);
    Oier.call(this,x,y,z,1,1,0,azimuth,elevation,0,0.92,0.88,1,1);
    this.accel = this.prevAccel = {x:0,y:0,z:0};
    this.maxAccelForce = 0.5;
}
Boid.prototype = Object.create(Oier.prototype);
Boid.prototype.yBound = function(yLow,yHigh,range,mag){
    var f = max(0,this.y-this.rad-yLow);
    if(f<range){
        this.accel.y += (range-f)*mag;
    }
    var f = max(0,yHigh-(this.y+this.rad));
    if(f<range){
        this.accel.y -= (range-f)*mag;
    }
}
Boid.prototype.xzBound = function(r,range,mag){
    var f = max(0,this.x-this.rad+r);
    if(f<range){
        this.accel.x += (range-f)*mag;
    }
    var f = max(0,r-(this.x+this.rad));
    if(f<range){
        this.accel.x -= (range-f)*mag;
    }
    
    var f = max(0,this.z-this.rad+r);
    if(f<range){
        this.accel.z += (range-f)*mag;
    }
    var f = max(0,r-(this.z+this.rad));
    if(f<range){
        this.accel.z -= (range-f)*mag;
    }
}
Boid.prototype.oneVectorSeparation = function(boids){
    var vec = {x:0,y:0,z:0};
    for(var i = 0; i<boids.length; i++){
        that = boids[i];
        if(this===that){
            continue;
        }

        var d = distPointToPoint(this,that);
        if(d<4){
            vec = vAdd(vec,vScale(vNormalize(vSub(this,that)),(4-d)/4));
        }
    }
    if(vLength(vec)!==0){
        vec = vScale(vNormalize(vec),0.3);
        this.accel = vAdd(this.accel,vec);
    }
}
Boid.prototype.oneVectorCohesion = function(boids){
    var vec = {x:0,y:0,z:0};
    for(var i = 0; i<boids.length; i++){
        that = boids[i];
        if(this===that){
            continue;
        }

        var d = distPointToPoint(this,that);
        if(d<20){
            vec = vAdd(vec,vScale(vNormalize(vSub(that,this)),(20-d)/20));
        }
    }
    if(vLength(vec)!==0){
        vec = vScale(vNormalize(vec),0.15);
        this.accel = vAdd(this.accel,vec);
    }
}
Boid.prototype.oneVectorAlignment = function(boids){
    var changeVec = {x:0,y:0,z:0};
    var changeCount = 0;
    for(var i = 0; i<boids.length; i++){
        that = boids[i];
        if(this===that){
            continue;
        }

        var d = distPointToPoint(this,that);
        if(d<20){
            changeVec = vAdd(changeVec,that.prevAccel);
            changeCount++;
        }
    }
    if(changeCount>0&&vLength(changeVec)!==0){
        changeVec = vScale(changeVec,1/changeCount);
        this.accel = vAdd(this.accel,changeVec);
    }
}
Boid.prototype.adjustDistance = function(boids,detection,constant){
    var changeVec = {x:0,y:0,z:0};
    for(var i = 0; i<boids.length; i++){
        that = boids[i];
        if(this===that){
            continue;
        }

        var d = distPointToPoint(this,that);
        var vec = vNormalize(vSub(this,that));
        if(d<detection){
            var f = sin(70*sqrt(1.5*d+1))+constant;
            changeVec = vAdd(changeVec,vScale(vec,f));
        }
    }
    if(vLength(changeVec)!==0){
        changeVec = vScale(vNormalize(changeVec),sqrt(vLength(changeVec))*0.05);
        this.accel = vAdd(this.accel,changeVec);
    }
}
Boid.prototype.markFriends = function(boids,iBound,distLowBound,distHighBound){
    if(distHighBound===undefined){
        distHighBound = 8;
    }
    if(distLowBound===undefined){
        distLowBound = 7;
    }
    for(var i = 0; i<iBound; i++){
        that = boids[i];
        if(this===that){
            continue; // redundant
        }
        var d = distPointToPoint(this,that);
        if(d>distLowBound&&d<distHighBound){
            drawLine({v1:pCopy(this),v2:pCopy(that),rad:0.4,col:[150,0,255,120]},false);
        }
    }
}
Boid.prototype.exist = function(boids,doBounds,detection,constant){
    if(detection===undefined){
        detection = 11;
    }
    if(constant===undefined){
        constant = 9.2; // 8
    }

    this.accel = {x:0,y:0,z:0};
    if(doBounds){
        this.yBound(0,50,8,0.02);
        this.xzBound(90,8,0.02);
    }
    else{
        this.yBound(0,90,8,0.01);
    }

    this.adjustDistance(boids,detection,constant);
    // this.oneVectorSeparation(boids);
    // this.oneVectorCohesion(boids);
    // this.oneVectorAlignment(boids);
    
    if(vLength(this.accel)!==0){
        if(vLength(this.accel)>this.maxAccelForce){
            this.accel = vScale(vNormalize(this.accel),this.maxAccelForce);
        }
        this.vectorAccelerate(this.accel);
    }
    this.prevAccel = this.accel;
    
    this.drift(true);
}
Boid.prototype.draw = function(){
    drawModel(icosahedronModel,this.x,this.y,this.z,this.rad,this.rad,this.rad,0,0,0,[125,0,245],true);
}

var LightMaker = function(x,y,z,strength,midRange,exponentBase,maxHarsh,lifetime){
    Oier.call(this,x,y,z,0,0,0,0,0,0,0,0,0,Infinity);
    this.strength=strength;
    this.midRange=midRange;
    this.exponentBase=exponentBase;
    this.maxHarsh=maxHarsh;
    this.lifetime = lifetime;
    this.timer = lifetime;
};
LightMaker.prototype = Object.create(Oier.prototype);
LightMaker.prototype.exist = function(){
    this.drift();
    createLightSource(this.x,this.y,this.z,pow(this.timer/this.lifetime,0.65)*this.strength,this.midRange,this.exponentBase,this.maxHarsh);
    this.timer--;
    if(this.timer<=0){
        this.hp = 0;
    }
};

var LavaPlate = function(x,y,z,xv,zv,turnSeed,lifetime,semisize,col){
    this.x=x; this.y=y; this.z=z;
    this.xv=xv; this.zv=zv;
    this.lifetime = lifetime;
    this.maxLifetime = lifetime;
    this.col = col;
    if(col.length<4){col[3]=255;}
    this.semisize = semisize;
    this.turnSeed = turnSeed;
};
LavaPlate.prototype.drift = function(){
    this.x+=this.xv;
    this.z+=this.zv;
    if(dist(0,0,this.xv,this.zv)>0.02){
        this.xv*=0.97;
        this.zv*=0.97;
    }
    this.lifetime--; // must splice from the array for loop :(
};
LavaPlate.prototype.respawn = function(maxDistToCamera){
    this.x=c.x+random(-maxDistToCamera,maxDistToCamera);
    this.z=c.z+random(-maxDistToCamera*0.6,1.6*maxDistToCamera);
    this.lifetime=this.maxLifetime;
};
LavaPlate.prototype.draw = function(){
    var opacityFactor = 1-(
        max(abs(this.lifetime-this.maxLifetime/2)-this.maxLifetime/2+50,0)/50
    );
    var squ = {
        v1:{x:this.x-this.semisize,y:this.y,z:this.z+this.semisize},
        v2:{x:this.x+this.semisize,y:this.y,z:this.z+this.semisize},
        v3:{x:this.x+this.semisize,y:this.y,z:this.z-this.semisize},
        v4:{x:this.x-this.semisize,y:this.y,z:this.z-this.semisize},
        col:[this.col[0],this.col[1],this.col[2],this.col[3]*opacityFactor],
    };
    angRotateQuaTea(squ,this,this.turnSeed+ganime/4,0,0);
    //console.log(squ.v1.z);noLoop();
    if(drawQuad(squ,false)){graphics[graphics.length-1].depth=1e9;}
};


// 2d maze "y" is -z in 3d. x is x
var InfiniteMaze = function(x,y,z,rad,h,connectionFunc,tileSize,chunkSize,loadingRad){
    this.generatedLootLocs = new Set();
    
    this.drawOnlyCross = false;
    this.crossWidth = 2*this.tileSize;
    this.drawWallUnitsMerged = false; // maybe only draw them merged if the maze is huge and being viewed from far away. otherwise the render is bad

    this.x = x; // x,y,z don't do anything currently but should be the starting point of generation considered the origin
    this.y = y;
    this.z = z;
    this.rad = rad; // how much the 2d walls expand into 3d space for wall collision
    this.h = h; // height of walls
    this.connectionFunc = connectionFunc;
    this.tileSize = tileSize;
    this.chunkSize = chunkSize; // chunk size in terms of tiles (like, chunks for hilbert's curve for growth zones)
    this.loadingRad = loadingRad;

}
InfiniteMaze.prototype.drawWall = function(x1,z1,x2,z2){
    let drewFirst = drawQuad({
        v1:{x:x1,y:this.h,z:z1},
        v2:{x:x1,y:0,z:z1},
        v3:{x:x2,y:0,z:z2},
        v4:{x:x2,y:this.h,z:z2},
        col:[90,100,110],
    },true);

    if(drawQuad({
        v1:{x:x1,y:this.h*0.6,z:z1},
        v2:{x:x1,y:this.h*0.8,z:z1},
        v3:{x:x2,y:this.h*0.8,z:z2},
        v4:{x:x2,y:this.h*0.6,z:z2},
        // col:[180,130,40],
        col:[75,85,95],
    },true)){
        if(drewFirst){
            graphics[graphics.length-1].depth=graphics[graphics.length-2].depth-0.000001;
        }
    }
}
InfiniteMaze.prototype.draw = function(){
    let xFirst = round((player.x-this.loadingRad)/this.tileSize);
    let xLast = round((player.x+this.loadingRad)/this.tileSize);
    let yFirst = round(-(player.z+this.loadingRad)/this.tileSize); // 2d
    let yLast = round(-(player.z-this.loadingRad)/this.tileSize);


    if(this.drawWallUnitsMerged){ // probably false
        // merge unit walls into longer walls
        for(let x = xFirst; x<=xLast; x++){
            let zFrom = null;
            let zTo = null;
            for(let y = yFirst; y<=yLast; y++){
                let open = isNbDirOf(connectionByGrowthInHilbert,x,y,0,this.chunkSize);
                if(!open){
                    if(zFrom===null){
                        zFrom = (-y+0.5)*this.tileSize;
                    }
                    zTo = (-y-0.5)*this.tileSize;
                }
                if((open||y===yLast)&&zFrom!==null){
                    this.drawWall((x+0.5)*this.tileSize,zFrom,(x+0.5)*this.tileSize,zTo);
                    zFrom = null;
                    zTo = null;
                }
            }
        }
        for(let y = yFirst; y<=yLast; y++){
            let xFrom = null;
            let xTo = null;
            for(let x = xFirst; x<=xLast; x++){
                let open = isNbDirOf(connectionByGrowthInHilbert,x,y,3,this.chunkSize);
                if(!open){
                    if(xFrom===null){
                        xFrom = (x-0.5)*this.tileSize;
                    }
                    xTo = (x+0.5)*this.tileSize;
                }
                if((open||x===xLast)&&xFrom!==null){
                    this.drawWall(xFrom,(-y-0.5)*this.tileSize,xTo,(-y-0.5)*this.tileSize);
                    xFrom = null;
                    xTo = null;
                }
            }
        }
    }
    else{
        // draw every unit wall
        for(let x = xFirst; x<=xLast; x++){
            for(let y = yFirst; y<=yLast; y++){
                if(!isNbDirOf(connectionByGrowthInHilbert,x,y,0,this.chunkSize)){
                    let ok;
                    if(this.drawOnlyCross) ok = abs((x+0.5)*this.tileSize-player.x)<=this.crossWidth||abs(-y*this.tileSize-player.z)<=this.crossWidth;
                    else ok = dist((x+0.5)*this.tileSize,-y*this.tileSize,player.x,player.z)<this.loadingRad;
                    if(ok) this.drawWall((x+0.5)*this.tileSize,(-y+0.5)*this.tileSize,(x+0.5)*this.tileSize,(-y-0.5)*this.tileSize);
                }
                if(!isNbDirOf(connectionByGrowthInHilbert,x,y,3,this.chunkSize)){
                    let ok;
                    if(this.drawOnlyCross) ok = abs(x*this.tileSize-player.x)<=this.crossWidth||abs((-y-0.5)*this.tileSize-player.z)<=this.crossWidth;
                    else ok = dist(x*this.tileSize,(-y-0.5)*this.tileSize,player.x,player.z)<this.loadingRad;
                    if(ok) this.drawWall((x+0.5)*this.tileSize,(-y-0.5)*this.tileSize,(x-0.5)*this.tileSize,(-y-0.5)*this.tileSize);
                }
            }
        }
    }
}
InfiniteMaze.prototype.makeCollider = function(){
    let xFirst = round((player.x-this.loadingRad)/this.tileSize);
    let xLast = round((player.x+this.loadingRad)/this.tileSize);
    let yFirst = round(-(player.z+this.loadingRad)/this.tileSize); // 2d
    let yLast = round(-(player.z-this.loadingRad)/this.tileSize);
   
    // merge unit walls into longer walls
    for(let x = xFirst; x<=xLast; x++){
        let zFrom = null;
        let zTo = null;
        for(let y = yFirst; y<=yLast; y++){
            let open = isNbDirOf(connectionByGrowthInHilbert,x,y,0,this.chunkSize);
            if(!open){
                if(zFrom===null){
                    zFrom = (-y+0.5)*this.tileSize;
                }
                zTo = (-y-0.5)*this.tileSize;
            }
            if((open||y===yLast)&&zFrom!==null){
                let nx = (x+0.5)*this.tileSize;
                let ny = this.h/2;
                let nz = (zFrom+zTo)/2; // +-
                colliders.push({
                    idTag:-1,
                    type:"box",
                    x:nx,y:ny,z:nz,
                    prevx:nx,prevy:ny,prevz:nz,
                    l:this.rad, h:this.h/2, w:abs(zFrom-zTo)/2,
                    azimuth:0,//this.azimuth,
                    giveJumpFunc:giveJump
                });
                zFrom = null;
                zTo = null;
            }
        }
    }
    for(let y = yFirst; y<=yLast; y++){
        let xFrom = null;
        let xTo = null;
        for(let x = xFirst; x<=xLast; x++){
            let open = isNbDirOf(connectionByGrowthInHilbert,x,y,3,this.chunkSize);
            if(!open){
                if(xFrom===null){
                    xFrom = (x-0.5)*this.tileSize;
                }
                xTo = (x+0.5)*this.tileSize;
            }
            if((open||x===xLast)&&xFrom!==null){
                let nx = (xFrom+xTo)/2;  // +-
                let ny = this.h/2;
                let nz = (-y-0.5)*this.tileSize;
                colliders.push({
                    idTag:-1,
                    type:"box",
                    x:nx,y:ny,z:nz,
                    prevx:nx,prevy:ny,prevz:nz,
                    l:abs(xFrom-xTo)/2, h:this.h/2, w:this.rad,
                    azimuth:0,//this.azimuth,
                    giveJumpFunc:giveJump
                });
                xFrom = null;
                xTo = null;
            }
        }
    }


    // // naive
    // for(let x = xFirst; x<=xLast; x++){
    //     for(let y = yFirst; y<=yLast; y++){
    //         if(!isNbDirOf(connectionByGrowthInHilbert,x,y,0,this.chunkSize)){
    //             let nx = (x+0.5)*this.tileSize;
    //             let ny = this.h/2;
    //             let nz = -y*this.tileSize; // +- 0.5*this.tileSize
    //             colliders.push({
    //                 idTag:-1,
    //                 type:"box",
    //                 x:nx,y:ny,z:nz,
    //                 prevx:nx,prevy:ny,prevz:nz,
    //                 l:this.rad, h:this.h/2, w:this.tileSize/2, // smoother than w:this.tileSize/2+this.rad
    //                 azimuth:0,//this.azimuth,
    //                 giveJumpFunc:giveJump
    //             });
    //         }
    //         if(!isNbDirOf(connectionByGrowthInHilbert,x,y,3,this.chunkSize)){
    //             let nx = x*this.tileSize;  // +- 0.5*this.tileSize
    //             let ny = this.h/2;
    //             let nz = (-y-0.5)*this.tileSize;
    //             colliders.push({
    //                 idTag:-1,
    //                 type:"box",
    //                 x:nx,y:ny,z:nz,
    //                 prevx:nx,prevy:ny,prevz:nz,
    //                 l:this.tileSize/2, h:this.h/2, w:this.rad, // smoother than l:this.tileSize/2+this.rad  
    //                 azimuth:0,//this.azimuth,
    //                 giveJumpFunc:giveJump
    //             });
    //         }
    //     }
    // }
}
InfiniteMaze.prototype.generateLoot = function(){
    let xFirst = round((player.x-this.loadingRad)/this.tileSize);
    let xLast = round((player.x+this.loadingRad)/this.tileSize);
    let yFirst = round(-(player.z+this.loadingRad)/this.tileSize); // 2d
    let yLast = round(-(player.z-this.loadingRad)/this.tileSize);

    for(let x = xFirst; x<=xLast; x++){
        for(let y = yFirst; y<=yLast; y++){
            if(dist(x*this.tileSize,-y*this.tileSize,player.x,player.z)<this.loadingRad){ // optional circle
                let me = adjacentUniquePriority(x,y);
                if((me&240)==16&&nbDirsOf(this.connectionFunc,x,y,this.chunkSize).length===1){
                    if(!this.generatedLootLocs.has(x+","+y)){
                        if(me&3){
                            items.push(Coin.new(x*this.tileSize,4,(-y)*this.tileSize));
                        }
                        else{
                            items.push(Boost.new(x*this.tileSize,4,(-y)*this.tileSize));
                        }
                        this.generatedLootLocs.add(x+","+y);
                    }
                }
            }
        }
    }

}





var nbDirsOf = function(connectionFunc,x,y,chunkSize){
  let nbDirs = [connectionFunc(x,y,chunkSize)];
  for(let d = 0; d<4; d++){
    if(d==nbDirs[0]) continue;
    if(connectionFunc(x+dirx[d],y+diry[d],chunkSize)==(d^2)){
      nbDirs.push(d);
    }
  }
  return nbDirs;
}
var isNbDirOf = function(connectionFunc,x,y,dir,chunkSize){
  return connectionFunc(x,y,chunkSize)==dir||connectionFunc(x+dirx[dir],y+diry[dir],chunkSize)==(dir^2);
}
// is symmetric over axes
var adjacentUniquePriority = function(x,y) {
  x ^= (x >> 16);
  y ^= (y >> 16);
  let h = (x * 0x9E3779B9) ^ (y * 0x85EBCA6B);
  h ^= (h >> 13);
  h *= 0xC2B2AE35;
  h ^= (h >> 16);
  // make it unsigned 32-bit
  h = h >>> 0;
  h|=2;
  if ((x & 1) === (y & 1)) { // adjacent unique
    h-=2;
  }
  return h;
}
var booleanOption = function(r1,r2,r3){
  return ((r2^r3)&8)==(r1&4);
}
/*
  O(log(x+y))

  o: from dirs
    0,0 down
    1,0 left
    1,1 up
    0,1 undefined
  relational transformations (all self-inverting!):
    o->a nothing
    o->b reflect over \
    o->c rotate 180 deg
    o->d reflect over /

  // base cases are redundant because already included in the transitional bridges!
  if(x==0&&y==0){return 3;}
  if(x==1&&y==0){return 2;}
  if(x==1&&y==1){return 1;}
*/
var connectionByHilbertRecursive = function(x,y,size){
  let ret;
  if(x<size/2){
    if(y<size/2){
      // only happens if you pass in an unnecessarily large size
      if(x==0&&y==size/2-1) ret = 3; // left side connects down
      else ret = connectionByHilbertRecursive(x,y,size/2);
    }
    else{
      if(x==0&&y==size-1) ret = 3; // undefined for the finite square case, so it'd use the 3 from the first bridge case for the square of double size
      else ret = connectionByHilbertRecursive((size-1-y),(size-1-x)-size/2,size/2)^1; // reflected over slash
    }
  }
  else{
    if(y<size/2){
      if(x==size/2&&y==size/2-1) ret = 2; // top middle bridges left
      else ret = connectionByHilbertRecursive(x-size/2,y,size/2);
    }
    else{
      if(x==size-1&&y==size/2) ret = 1; // right side connects up
      else ret = connectionByHilbertRecursive((y)-size/2,(x)-size/2,size/2)^3; // reflected over backslash
    }
  }

  return ret;
}
var connectionByHilbert = function(x,y){
  // same as calling on the recursive one with (x,y,big power of 2) but it handles negatives as well
  let needHFlip = x<0;
  let needVFlip = y<0;
  x = abs(x)-(x<0);
  y = abs(y)-(y<0);
  
  let size = 2;
  while(!(x<size&&y<size)){
    size*=2;
  }

  let ret = connectionByHilbertRecursive(x,y,size);
  if(needHFlip&&ret%2==0) ret^=2;
  if(needVFlip&&ret%2==1) ret^=2;
  return ret;
}
var connectionByGrowthInHilbert = function(x,y,chunkSize){
  let growDir = connectionByHilbert(floor(x/chunkSize),floor(y/chunkSize))^2;

  let me = adjacentUniquePriority(x,y);
  let up = adjacentUniquePriority(x+dirx[growDir+1],y+diry[growDir+1]); // 90 degrees counterclockwise from growDir
  let upGrowDir = connectionByHilbert(floor((x+dirx[growDir+1])/chunkSize),floor((y+diry[growDir+1])/chunkSize))^2;
  let down = adjacentUniquePriority(x+dirx[growDir+3],y+diry[growDir+3]); // 90 degrees clockwise from growDir
  let downGrowDir = connectionByHilbert(floor((x+dirx[growDir+3])/chunkSize),floor((y+diry[growDir+3])/chunkSize))^2;
  let left = adjacentUniquePriority(x+dirx[growDir+2],y+diry[growDir+2]); // backward from growDir

  let ret;
  if(up<me&&upGrowDir==growDir){
    if(down<me&&downGrowDir==growDir){
      ret = 1+2*booleanOption(me,up,down);
    }
    else{
      ret = 1+booleanOption(me,left,up);
    }
  }
  else{
    if(down<me&&downGrowDir==growDir){
      ret = 2+booleanOption(me,left,down);
    }
    else{
      ret = 2;
    }
  }
  return (ret+growDir)%4;
}









var portals = []; // usually only one but yeah
var Portal = function(x,y,z,azimuth,onIntersection,col){
    this.x=x; this.y=y; this.z=z;
    this.rad = 1.6;
    this.col=col;
    this.azimuth = azimuth;
    this.onIntersection = onIntersection;
}; // they let you win (this.rad is always 1.5)
Portal.prototype.draw = function(){
    if(drawModel(icosahedronModel,this.x,this.y,this.z,this.rad*1.05,this.rad*1.05,this.rad*1.05,this.azimuth,0,0,[max(80,this.col[0]),max(80,this.col[1]),max(80,this.col[2]),this.col[3]],false)){
        graphics[graphics.length-1].depth+=0.3;
    }
    if(drawModel(icosahedronModel,this.x,this.y,this.z,this.rad*0.9,this.rad*0.9,this.rad*0.9,this.azimuth,0,0,this.col,true)){
        graphics[graphics.length-1].depth-=0.15;
        
    }
    createLightSource(this.x,this.y+this.rad*2,this.z,0.1,5,0);
};
Portal.prototype.operate = function(){
    this.azimuth+=2;
    if(this.y+this.rad>=player.y&&this.y-this.rad<=player.y+player.h&&dist(this.x,this.z,player.x,player.z)<player.rad+this.rad*1.05){
        this.onIntersection();
        playNote(1,0,random(2.5,3),0,100,0.7);
    }
};

// memory is passed as an object of variables that it remembers as properties of itself 
levels = [];
var Level = function(name,onStart,whileRunning,onEnd){
    this.name = name;
    
    this.onStart = onStart; // these three are functions
    this.whileRunning = whileRunning;
    this.onEnd = onEnd;
    
    // memory is accessed with "this.attribute" within the three funcs
};

var findLevel = function(levelName){
    var lowLevelName = levelName.toLowerCase();
    for(var i = 0; i<levels.length; i++){
        if(levels[i].name.toLowerCase()===lowLevelName){
            return(i);
        }
    }
    return(-1);
};
var switchToLevel = function(level){
    if(currentLevel>=0){
        levels[currentLevel].onEnd();
    }
    currentLevel = level;
    if(currentLevel>=0){
        levels[currentLevel].onStart();
    }
};


var drawCursor = function(mX,mY,scaleF,colorObj){
    push();
    translate(mX,mY);
    scale(scaleF/25);
    fill(colorObj);
    noStroke();
    triangle(0,0,20,20,0,20);
    scale(-1,1); rotate(45);
    triangle(0,0,20,20,0,20);
    pop();
};

var wMap = {
    drawX:0, drawY:0,
    mX:175+10, mY:150-10,
    units:[],
    onStart:function(){
        wMap.mX=wMap.drawX+175; // +0
        wMap.mY=wMap.drawY+150; // +0
    },
    whileRunning:function(){
        push();
        scale(min(width,height)/600,min(width,height)/600);
        translate(300-wMap.drawX,300-wMap.drawY);
        
        background(200);
        
        var mXChange = mouse.x-mouse.prevx;
        var mYChange = mouse.y-mouse.prevy;
        // for(var i = 0; i<3; i++){
        //     drawCursor(wMap.mX+i*mXChange/4,wMap.mY+i*mYChange/4,color(0,0,0,50+i*50));
        // }
        wMap.mX+=mXChange;
        wMap.mY+=mYChange;
        
        
        for(var i = 0; i<wMap.units.length; i++){
            wMap.units[i].drawIcon();
        }
        for(var i = 0; i<wMap.units.length; i++){
            if(abs(wMap.mX-wMap.units[i].x)<=27&&abs(wMap.mY-wMap.units[i].y)<=27){
                if(mouse.status==="clicking"){
                    wMap.units[i].onClick();
                }
                else{
                    wMap.units[i].onHover();
                }
                break;
            }
        }
        
        
        
        drawCursor(wMap.mX,wMap.mY,20,color(255, 255, 255));
        drawCursor(wMap.mX-mXChange/2,wMap.mY-mYChange/2,20,color(255, 255, 255));
        drawCursor(wMap.mX-mXChange/2+1,wMap.mY-mYChange/2+2.2,16,color(0, 0, 0));
        drawCursor(wMap.mX+1,wMap.mY+2.2,16,color(0, 0, 0));
        
        
        pop();
    },
};
var wMapUnit = function(levelName,x,y,col){
    this.levelName=levelName;
    this.x=x; this.y=y;
    this.col=col;
}; // i really don't know what to call these. they are icons on the map which when let you go to different levels. they're like level icons, but level things on the map, not just pictures.
wMapUnit.prototype.drawIcon = function(){
    push();
    if(this.col===undefined){
        fill(0,30);
        if(usingWebgl){
            noStroke();
        }
        else{
            stroke(0,50);
            strokeWeight(4);
        }
        rect(this.x-25,this.y-25,50,50,18);
    }
    else{
        fill(this.col[0],this.col[1],this.col[2],(this.col[3]||255));
        noStroke();
        rect(this.x-25,this.y-25,50,50);
    }
    pop();
};
wMapUnit.prototype.onHover = function(){
    noStroke();
    fill(255);
    rect(wMap.mX+5,wMap.mY+7,252,67);
    fill(0);
    
    push();
    translate(wMap.mX+6,wMap.mY+8);
    rect(0,0,250,65);
    fill(255);
    textAlign(LEFT,TOP);
    textSize(15);
    text(this.levelName,10,10,250,10000);
    pop();
};
wMapUnit.prototype.onClick = function(){
    switchToLevel(findLevel(this.levelName));
    screen="game";
};


var drawCrossHair = function(){
    strokeWeight(2);
    stroke(200);
    line(0,-8,0,8);
    line(-8,0,8,0);
    noStroke();
};
var drawBoostIcon = function(x,y,siz){
    push();
    translate(x,y);
    scale(siz/120,siz/100);
    noStroke();
    fill(190, 0, 220);
    triangle(-100,0,0,-100,100,0);
    rect(-45,0,90,100);
    fill(230, 50, 255);
    triangle(-70,-10,0,-80,70,-10);
    rect(-30,-10,60,95);
    pop();
};
var drawCoinIcon = function(x,y,siz){
    push();
    translate(x,y);
    scale(siz/100,siz/100);
    noStroke();
    fill(245, 200, 0);
    ellipse(-5,0,100,100);
    fill(260,245,20);
    ellipse(5,0,100,100);
    pop();
};

var playerAndCameraManagement = function(){
    player.drift();
    player.makeCollider();
    player.canJump--;
    if(player.canJump<0.0001){player.canJump=0;}
    player.interactWithColliders(false,true);
    
    if(inp[220]){player.canJump=1;}
    player.operate();
    player.gravity(0.015);
    c.syncToPlayer();
    c.viewControl();
    c.getComplexes();
    // if(c.canResetFOV){c.adjustFOVToRanges(1,1);}
    if(c.canResetFOV){c.adjustFOVToRanges(width/height,1);}
    c.customPlanes=[];
};
var resetPlayerAndCameraTo = function(x,y,z,azimuth,elevation,twist){
    player.x=c.x=x;
    player.y=c.y=y;
    player.z=c.z=z;
    player.azimuth=c.azimuth=azimuth;
    player.elevation=c.elevation=elevation;
    player.twist=c.twist=twist;
    c.zoomScale = defaultZoom;
    player.xv=player.yv=player.zv=0;
    player.jumpCooldown = 0;
    player.aUStatus = "idle";
    player.aLStatus = "idle";
    player.aUTime = 0;
    player.aLTime = 0;
    player.aMovingSpeed = 0; // how much effort the player is putting into running
    player.aMovingUnitVector = {x:0,y:0,z:0}; // what direction player is trying to accelerate in (relatively)
};
                    
/** ~~~~~~~~~~~~ Game Content ~~~~~~~~~~~~ **/




// when running level gen function, you can assume there are no solids. (they have been cleared from before.) level end should not reward player as though they finished the level successfully. 


               
/** ~~~~~~~~~~~ Main Function ~~~~~~~~~~~~ **/




//var ton = false,ttime = 0,tplace = {};
main = function(){
    //if(inp[70]){inp[70]=false;if(ton){console.log(dist(player.x,player.z,tplace.x,tplace.z)/ttime);ton = false;}else{ttime = 0;tplace={x:player.x,z:player.z};ton = true;}}if(ton){ttime++;}
    
    switch(screen){
        case "map":
            wMap.whileRunning();
            if(inp[77]){
                inp[77]=false;
                screen = "game";
            }
            break;
        case "game":
            if(currentLevel>=0){
                levels[currentLevel].whileRunning();
                if(inp[191]){
                    drawDevInfo();
                }
            }
            else{
                background(0);
                fill(255);
                textSize(30);
                textAlign(CENTER,CENTER);
                noStroke();
                text("Error:\nLevel["+currentLevel+"] doesn't exist!",300,300);
            }
            if(inp[77]){
                inp[77]=false;
                wMap.onStart();
                screen = "map";
            }
            if(inp[78]){
                inp[78]=false;
                switchToLevel(currentLevel);
            }
            break;
    }
    
    mouseNature();
};



                    }





function setup(){
    

    if(usingWebgl){
        createCanvas(windowWidth,windowHeight,WEBGL); // note: without beginShape batching, WEBGL is MUCH slower!
        // hint(DISABLE_DEPTH_TEST);
        textFont(loadFont('Inconsolata.otf'));
    }
    else{
        createCanvas(windowWidth,windowHeight);
        textFont('Verdana');
    }

    // textFont("Lucida Console Bold"); // khanacademy
    strokeJoin(ROUND);  
    angleMode(DEGREES);




    mouse = {
    x:width/2,
    y:height/2,
    prevx:width/2,
    prevy:height/2,
    sensitivity:1,
    status:"idle",
    };

    let canvas = document.querySelector('canvas');

    // Request pointer lock when clicking on the canvas
    canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
    });

    // Listen for raw mouse movement events
    document.addEventListener("mousemove", handleMouseMove);

    // Detect pointer lock state changes
    document.addEventListener("pointerlockchange", () => {
    if (document.pointerLockElement === canvas) {
        paused = false; // Cursor locked
    } else {
        paused = true; // Cursor unlocked
        fill(180,100);
        noStroke();
        push();
        if(usingWebgl){
            translate(-width/2,-height/2);
        }
        rect(0,0,width,height);
        pop();
    }
    });

    bagelModel = makeBagelModel(1/3,12,8);

    // player
    player = Mannequin.new(0,12,-7, 0.7, 0,0,0, [[165,165,165],[235,235,250],[255,0,0],[0,0,255],[255,0,0],[0,0,255]], 100,function(){},function(){},function(){});
    player.idTag = 82804590;
    player.pov = 1;
    player.jumpCooldown = 0;
    player.aUStatus = "idle";
    player.aLStatus = "idle";
    player.aUTime = 0;
    player.aLTime = 0;
    player.aMovingSpeed = 0; // how much effort the player is putting into running
    player.aMovingUnitVector = {x:0,y:0,z:0}; // what direction player is trying to accelerate in (relatively)
    player.inv = {
        coins:0,
        boosts:0,
    };
    player.boostCooldown = 0;
    player.holding = "nothing";
    player.holdingPoint = {x:Infinity,y:Infinity,z:Infinity};
    player.die = function(){
        player.hp = player.stats.hp;
        player.xv = player.yv = player.zv = 0;
        player.azimuth = player.elevation = player.twist = 0;
        player.canJump = false;
        player.jumpCooldown = 0;
        player.airFrictionFactor = player.stats.airFrictionFactor;
        player.groundFrictionFactor = player.stats.groundFrictionFactor;
        levels[currentLevel].onEnd();
        levels[currentLevel].onStart();
        playNote(18,1,1,0,100,0.6);
    };

    player.operate = function(){
        // must come after confirming that player can jump this frame

        // if(inp[69]){player.twist-=5;}
        // if(inp[81]){player.twist+=5;}
        //player head tilt as turning: player.twist+=sqrt(abs(mouse.x-mouse.prevx))*(1-2*(mouse.x<mouse.prevx))/10;
        player.twist*=0.85;
        if(mouse.x!==mouse.prevx||mouse.y!==mouse.prevy){
            var turnspeed = 0.4*pow(dist(mouse.x,mouse.y,mouse.prevx,mouse.prevy),0.75);
            if(inp[86]){turnspeed/=2;}
            if(inp[84]){turnspeed/=80;}
            var ang = atan2(mouse.x-mouse.prevx,mouse.y-mouse.prevy);
            if(player.pov!==4){
                player.elevation-=cos(ang)*turnspeed;
            }
            player.azimuth-=sin(ang)*turnspeed;
        }

        var jumped = false;
        // if(inp[32]&&(inp[70]||player.canJump&&player.jumpCooldown===0)){
        if(inp[32]&&(player.canJump&&player.jumpCooldown===0)){
            player.yv=0.35;
            jumped = true; // clearing canJump comes later
            playNote(2,0,random(0.55,0.75),0,100,0.3);
        }
        this.groundFrictionFactor=this.stats.groundFrictionFactor;
        this.airFrictionFactor=this.stats.airFrictionFactor;
        var relativexa = 0, relativeza = 0;
        if(inp[87]||inp[UP_ARROW]){relativeza++;}
        if(inp[65]||inp[LEFT_ARROW]){relativexa--;}
        if(inp[83]||inp[DOWN_ARROW]){relativeza--;}
        if(inp[68]||inp[RIGHT_ARROW]){relativexa++;}
        if(relativeza||relativexa){
            var speed;
            /* var isSprinting = inp[16]&&relativeza>0;
            if(isSprinting){
                if(player.pov===1){
                    c.zoom-=0.08;
                }
                else if(player.pov>=3){
                    c.zoom-=0.02;
                }
                speed = 0.0248; // less speed but less friction
                if(jumped){
                    speed=0.11;
                }
                player.aMovingSpeed = incLerp(player.aMovingSpeed,11,1,0.2);
                this.airFrictionFactor=pow(this.stats.airFrictionFactor,0.54);
                this.groundFrictionFactor=pow(this.stats.groundFrictionFactor,0.36);
                //speed = 0.09;
            }
            else*/ if(inp[71]){ // slowww
                speed = 0.057;
                this.groundFrictionFactor=pow(this.stats.groundFrictionFactor,10);
                player.aMovingSpeed = 0.1;
            }
            // else if(inp[70]){ // fly
            //     if(jumped){
            //         speed=0.27;
            //         player.aMovingSpeed = incLerp(player.aMovingSpeed,30,0.5,0.1);
            //     }
            //     else{
            //         speed = 0.17;
            //         player.aMovingSpeed = incLerp(player.aMovingSpeed,17,0.5,0.1);
            //     }
            // }
            else{ // normal walk
                speed = 0.057;
                if(jumped){
                    speed=0.065;
                }
                player.aMovingSpeed = incLerp(player.aMovingSpeed,9,0.35,0.15); // animation time +=8.5
            }

            var relativeAzimuth = atan2(relativeza,relativexa);
            player.aMovingUnitVector.x+=cos(relativeAzimuth);
            player.aMovingUnitVector.z+=sin(relativeAzimuth);
            if(!player.canJump){
                speed*=player.airAccelerationFactor;
            }
            player.azimuthAccelerate(relativeAzimuth+player.azimuth,speed);

            if(player.aLStatus==="idle"){
                player.aLStatus = "moving";
            }
            if(player.aUStatus==="idle"){
                player.aUStatus = "moving";
            }
        }
        else{
            player.aMovingSpeed = incLerp(player.aMovingSpeed,0,0.17,0.07);
            if(player.aMovingSpeed<0.1){
                player.aMovingSpeed=0;
                if(player.aLStatus==="moving"){
                    player.aLStatus = "idle";
                }
                if(player.aUStatus==="moving"){
                    player.aUStatus = "idle";
                }
            }
        }
        player.aMovingUnitVector.x*=0.88;
        player.aMovingUnitVector.z*=0.88;

        if(player.holding==="small gun"){
            player.aUStatus = "holding";
        }

        if(player.elevation>90){player.elevation=90;}
        if(player.elevation<-90){player.elevation=-90;}
        player.azimuth=anyModulo(player.azimuth,360);
        player.elevation=anyModulo(player.elevation+180,360)-180;
        player.twist=anyModulo(player.twist+180,360)-180;

        if(inp[67]){
            inp[67]=false;
            player.pov=player.pov%5+1;
        }
        if(jumped){
            player.canJump = 0;
            player.jumpCooldown = 3;
        }
        player.canJump--;
        if(player.canJump<0.0001){player.canJump=0;}
        player.jumpCooldown--;
        if(player.jumpCooldown<0.0001){player.jumpCooldown=0;}








        if(player.holding==="small gun"){
            if(mouse.status==="clicking" || inp[16]){
                inp[16] = false;
                var lightPoint = vAdd(player,vScale(vSub(player.holdingPoint,player),1.2));
                oiers.push(LightMaker.new(lightPoint.x,lightPoint.y,lightPoint.z,1.5,3,2,0,3));
                var newBullet = Bullet.new(player.x,player.y+player.eyeLevel,player.z,0.07,player.azimuth,player.elevation,10,100,0.4,60,player.idTag);
                newBullet.travel(1.1*vLength(vSub(player.holdingPoint,player)));
                if(newBullet.hp){
                    oiers.push(newBullet);
                }
            }
        }
    };
    player.animate = function(){
        var uArgs = [
            0,0,0,0, // left arm rotations
            0,0,0,0, // right
            player.azimuth,0,0,0,0.8*player.elevation+5 // body azimuth, elevation, twist, head azimuth, elevation
        ];
        var lArgs = [
            0,0,0,0, // left leg rotations
            0,0,0,0, // right
        ];
        var sizeArgs = [0.7*0.45,0.7*1,0.7*1.3,0.7*1.5,0.7*0.45,0.7*1.5];
        switch(player.aUStatus){
            case "moving":
                player.aUTime+=player.aMovingSpeed*1.15;
                player.aUTime=anyModulo(player.aUTime,360);
                uArgs = bodyFrameUArgsGenerators.run(player.aUTime/360,player.azimuth,player.aMovingSpeed,player.aMovingUnitVector.z,player.aMovingUnitVector.x);
                break;
        }
        switch(player.aLStatus){
            case "moving":
                player.aLTime+=player.aMovingSpeed*1.15;
                player.aLTime=anyModulo(player.aLTime,360);
                lArgs = bodyFrameLArgsGenerators.run(player.aLTime/360,player.aMovingSpeed);
                break;
        }

        uArgs[8] = player.azimuth;
        uArgs[12] = 0.8*player.elevation+5; // face the mouse direction
        // if(!canTilt){
        //     uArgs[8] = player.azimuth;
        //     uArgs[9] = 0;
        //     uArgs[10] = 0;
        //     uArgs[11] = 0;
        //     uArgs[12] = 0;
        // }
        player.bodyFrame = argsGenerateBodyFrame(
            player.x,player.y+player.eyeLevel+0.12,player.z,sizeArgs,uArgs,lArgs
        );

        // low level modifiers
        switch(player.aUStatus){
            case "holding":
                // var targetVec = {x:0,y:0,z:sizeArgs[2]*1.3};
                var animationTargetVec = {x:0,y:0,z:sizeArgs[2]*map(constrain(player.elevation,45,90),45,90,1.35,1.1)};
                angRotatePointTEA(animationTargetVec,origin,player.azimuth,player.elevation-12,0);
                // angRotatePointTEA(targetVec,origin,player.azimuth,player.elevation-10,0);
                // player.holdingPoint = vAdd(player.bodyFrame.eye,targetVec);
                player.holdingPoint = bodyFrameModifiers.reach(player.bodyFrame,vAdd(player.bodyFrame.eye,animationTargetVec));
                break;
        }
    };
    player.draw = function(depthHackMag,opacityFactor){
        var cols = this.bodyCols;
        if(opacityFactor!==undefined&&opacityFactor!==1){
            cols = [];
            for(var i = 0; i<this.bodyCols.length; i++){
                cols.push([]);
                for(var j = 0; j<this.bodyCols[i].length; j++){
                    cols[i][j] = this.bodyCols[i][j];
                }
                cols[i][3] = (cols[i][3]||255)*opacityFactor;
            }
        }
        depthHackMag = depthHackMag||0;
        // drawBodyFrame(player.bodyFrame);
        drawBody(player.bodyFrame,cols,depthHackMag);

        if(player.holding==="small gun"){
            drawModel(hookGunModel,player.holdingPoint.x,player.holdingPoint.y,player.holdingPoint.z,0.25,0.25,0.25,player.azimuth,player.elevation,player.twist,[20,20,50],true);
        }
    };

  
    // camera
    c = {
        x:0,
        y:0,
        z:0,
        azimuth:0,
        elevation:0,
        twist:0,
        zoom:1, // only adjust this one pls
        zoomScaleX:min(width,height)/2,
        zoomScaleY:min(width,height)/2,
        sidePlaneNormals:[
            {x:-1,y:0,z:1}, // right
            {x:0,y:-1,z:1}, // top
            {x:1,y:0,z:1}, // left
            {x:0,y:1,z:1}, // bottom
        ], // 90 fullAng FOV
        customPlanes:[],
        canResetFOV:true, // true unless doing custom camera stuff then setting to false will stop readjusting FOV to max
        antiComplexAzimuth:{r:1,i:0},
        antiComplexElevation:{r:1,i:0},
        antiComplexTwist:{r:1,i:0},
    };
    c.syncToWidthHeight = function(){
        c.zoomScaleX = min(width,height)/2;
        c.zoomScaleY = min(width,height)/2;
        c.adjustFOVToRanges(width/height,1);
    };
    c.adjustFOVToAngs = function(azimuthRange,elevationRange){
        c.sidePlaneNormals = [
            {x:-cos(azimuthRange/2),y:0,z:sin(azimuthRange/2)}, // right
            {x:0,y:-cos(elevationRange/2),z:sin(elevationRange/2)}, // top
            {x:cos(azimuthRange/2),y:0,z:sin(azimuthRange/2)}, // left
            {x:0,y:cos(elevationRange/2),z:sin(elevationRange/2)}, // bottom
        ];
    };
    c.adjustFOVToRanges = function(xRange,yRange){
        var azimuthRange = atan2(xRange/c.zoom,1)*2;
        var elevationRange = atan2(yRange/c.zoom,1)*2;
        c.sidePlaneNormals = [
            {x:-cos(azimuthRange/2),y:0,z:sin(azimuthRange/2)}, // right
            {x:0,y:-cos(elevationRange/2),z:sin(elevationRange/2)}, // top
            {x:cos(azimuthRange/2),y:0,z:sin(azimuthRange/2)}, // left
            {x:0,y:cos(elevationRange/2),z:sin(elevationRange/2)}, // bottom
        ];
    };
    c.getComplexes = function(){
        c.antiComplexAzimuth = angToComplex(-c.azimuth);
        c.antiComplexElevation = angToComplex(-c.elevation);
        c.antiComplexTwist = angToComplex(-c.twist);
    };
    c.makeCustomPlane = function(point,norm){
        var pointCopy = pCopy(point);
        var focus = vAdd(pointCopy,norm);
        complexAdjustPointForCamera(pointCopy);
        complexAdjustPointForCamera(focus);
        c.customPlanes.push({
            point:pointCopy,
            norm:vSub(focus,pointCopy)
        });
    }; // THIS TAKES WORLD INPUTS AND ADJUSTS THEM TO BE SUITABLE FOR USE ON CAMERA-ADJUSTED GRAPHICS
    c.movementControl = function(){
        if(inp[69]){c.twist-=5;}
        if(inp[81]){c.twist+=5;}
        c.twist*=0.85;
        if(mouse.x!==mouse.prevx||mouse.y!==mouse.prevy){
            var turnspeed = 0.4*pow(dist(mouse.x,mouse.y,mouse.prevx,mouse.prevy),0.75);
            // not using delta time because mouse stuff doesn't rely on frameRate
            // i'm from the future. delta time has been removed because it is not worth it.
            if(inp[86]){turnspeed/=2;}
            if(inp[84]){turnspeed/=80;}
            var ang = atan2(mouse.x-mouse.prevx,mouse.y-mouse.prevy);
            c.elevation-=cos(ang)*turnspeed;
            c.azimuth-=sin(ang)*turnspeed;
        }

        var speed = 0.25;
        if(inp[32]){c.y+=speed;}
        if(inp[16]){c.y-=speed;}
        var relativexa = 0, relativeza = 0;
        if(inp[87]||inp[UP_ARROW]){relativeza++;}
        if(inp[65]||inp[LEFT_ARROW]){relativexa--;}
        if(inp[83]||inp[DOWN_ARROW]){relativeza--;}
        if(inp[68]||inp[RIGHT_ARROW]){relativexa++;}
        if(relativeza||relativexa){
            var ang = atan2(relativeza,relativexa)+c.azimuth;
            c.x+=cos(ang)*speed;
            c.z+=sin(ang)*speed;
        }
        if(c.elevation>90){c.elevation=90;}
        if(c.elevation<-90){c.elevation=-90;}
        c.azimuth=anyModulo(c.azimuth,360);
        c.elevation=anyModulo(c.elevation+180,360)-180;
        c.twist=anyModulo(c.twist+180,360)-180;
        c.y=max(c.y,0);
    }; 
    c.viewControl = function(){
        if(inp[86]){c.zoom++;}
        c.zoom=defaultZoom+(c.zoom-defaultZoom)*0.8;
    };
    c.syncToPlayer = function(){
        var playerEye = {x:player.x,y:player.y+player.eyeLevel,z:player.z};
        switch(player.pov){
            case 1:
                setGoToPoint(c,playerEye);
                c.azimuth=player.azimuth; c.elevation=player.elevation; c.twist=player.twist;
                break;
            case 2:
                break;
            case 3:
                var thirdPersonFocusPoint = vAdd(vScale(angsToVector(player.azimuth-90,-20),0.65),playerEye);
                var thirdPersonPoint = vAdd(vScale(angsToVector(player.azimuth+180,-constrain(player.elevation,-89.99,89.99)),2.5),thirdPersonFocusPoint);
                setGoToPoint(c,thirdPersonPoint);
                c.azimuth=player.azimuth;
                c.elevation=player.elevation;
                c.twist=player.twist;
                break;
            case 4:
                var birdsEyeViewPoint = vAdd({x:cos(player.azimuth+90)*3,y:5,z:sin(player.azimuth+90)*3},playerEye);
                setGoToPoint(c,birdsEyeViewPoint);
                c.azimuth=player.azimuth;
                c.elevation=-90;
                c.twist=player.twist;
                break;
                break;
            case 5:
                var thirdPersonPoint = vAdd(vScale(angsToVector(player.azimuth+180,-constrain(player.elevation,-89.99,89.99)),40),playerEye);
                setGoToPoint(c,thirdPersonPoint);
                c.azimuth=player.azimuth;
                c.elevation=player.elevation;
                c.twist=player.twist;
                if(c.y<0){
                    var scaleFactor = playerEye.y/(playerEye.y-c.y);
                    c.x = playerEye.x+(c.x-playerEye.x)*scaleFactor;
                    c.z = playerEye.z+(c.z-playerEye.z)*scaleFactor;
                    c.y = 1e-8;
                }
                break;
        }
    };

  

    var mannequinTemplates = {
        zombie: Mannequin.new(-5,0,0,0.7,-45,0,0,[[70,130,70],[160,160,160],[70,130,70],[70,130,70],[50,80,110],[50,80,110]],100,function(){
        this.runAnimationMag = 0;
    },function(){
        var target = atan2(player.z-this.z,player.x-this.x)-90;
        if(angDist(this.azimuth,target)<20){
            this.runAnimationMag = incLerp(this.runAnimationMag,7,0.35,0.15);
            this.azimuthAccelerate(this.azimuth+90,0.025);
        }
        else{
            this.runAnimationMag = incLerp(this.runAnimationMag,1.5,0.35,0.15);
            for(var i = 0; i<10; i++){
                this.azimuth = angTo(this.azimuth,target,0.3);
            }
        }
        this.bodyFrame = argsGenerateBodyFrame(
            this.x,this.y+this.eyeLevel+0.12,this.z,
            [this.bodyScale*0.45,this.bodyScale*1,this.bodyScale*1.3,this.bodyScale*1.5,this.bodyScale*0.45,this.bodyScale*1.5],
            bodyFrameUArgsGenerators.zombie(ganime%60/60,this.azimuth),
            bodyFrameLArgsGenerators.run(ganime%45/45,this.runAnimationMag)
        );
    },function(){}),
    };

  levels = [
    
Level.new(
    "dry level",
    function(){},
    function(){
        graphics = [];
        graphicOrders = [];
        lightSources = [];
        lightVectors = [];
        colliders = [];
        
        
        
        for(var i = 0; i<solids.length; i++){
            solids[i].makeCollider();
        }
        
        colliders.push({idTag:-1,
            x:0,y:0,z:0,
            planeNorm:{x:0,y:1,z:0},
            type:"slp",
            giveJumpFunc:giveJump,
        }); // floor collider
        
        playerAndCameraManagement();
        
        createLightVector({x:0.1,y:-1,z:0.2},1,0.1);
        
        drawLattice(0,5,7,0.6,[70,70,80,160]);
        drawFloor(-0.000001,[75,75,85],true);
        
        for(var i = 0; i<solids.length; i++){
            solids[i].draw();
        }
        
        if(player.pov===2){
            player.animate();
            player.draw(0);
        }
        else if(player.pov>=3){
            player.animate();
            player.draw(0.4);
        }
        
        
        
        push();
        translate(width/2,height/2);
        scale(1,-1);
        background(100,200,255);
        noStroke();
        
        displayGraphics();
        
        if(player.pov===1){
            drawCrossHair();
        }
        
        pop();
    },
    function(){}
),
Level.new(
    "soft level",
    function(){
        this.orbs = [];
        for(var i = 0; i<50; i++){
            this.orbs.push({x:random(16,width-16),y:random(16,height-16),xv:random(-0.5,0.5),yv:random(-0.5,0.5)});
        }
    },
    function(){
        noStroke();
        background(150,150,100);
        if(ganime%180===10){
            for(var i = 0; i<6; i++){
                this.orbs.push({x:random(16,width-16),y:random(16,height-16),xv:random(-1.5,1.5),yv:random(-1.5,1.5)});
            }
        }
        for(var i = this.orbs.length-1; i>-1; i--){
            this.orbs[i].xv+=(mouse.x-mouse.prevx)/40;
            this.orbs[i].yv+=(mouse.y-mouse.prevy)/40;
            if(abs(this.orbs[i].xv)>16){this.orbs[i].xv*=0.95;}
            if(abs(this.orbs[i].yv)>16){this.orbs[i].yv*=0.95;}
            this.orbs[i].x+=this.orbs[i].xv;
            this.orbs[i].y+=this.orbs[i].yv;
            if(this.orbs[i].x<16||this.orbs[i].x>width-16){
                this.orbs[i].xv*=-1.2;
                if(this.orbs[i].x<16){this.orbs[i].x=16;}
                else{this.orbs[i].x=width-16;}
            }
            if(this.orbs[i].y<16||this.orbs[i].y>height-16){
                this.orbs[i].yv*=-1.2;
                if(this.orbs[i].y<16){this.orbs[i].y=16;}
                else{this.orbs[i].y=height-16;}
            }
            
            var orbExists = true;
            for(var j = 0; j<i; j++){
                if(dist(this.orbs[j].x,this.orbs[j].y,this.orbs[i].x,this.orbs[i].y)<27){
                    this.orbs.splice(i,1);
                    this.orbs.splice(j,1);
                    i--;
                    orbExists = false;
                    break;
                }
            }
            if(orbExists){
                fill(130,130,70);
                ellipse(this.orbs[i].x,this.orbs[i].y,32,32);
            }
        }
    },
    function(){
        this.orbs = [];
    }
),
Level.new(
    "quiet level",
    function(){
        this.counter = 12345;
        // localStorage.setItem("T3D Knowing Level Counter",(parseInt(localStorage.getItem("T3D Knowing Level Counter"),10)+1)||1);
        // this.counter = localStorage.getItem("T3D Knowing Level Counter");
    },
    function(){
        background(222,222,255);
        fill(150);
        textSize(30);
        var txt = ceil(this.counter/2)+" time";
        if(this.counter!==2){txt+="s";}
        text(txt,90,90);
    },
    function(){}
),
Level.new(
    "demo level",
    function(){
        resetPlayerAndCameraTo(0,2,0, 0,0,0);
        for(var i = 0; i<0; i++){
            stars.push({x:0,y:0,z:random(7000,29000)});
            angRotatePointTEA(stars[i],origin,random(0,360),random(0,acos(random(0,0.99999))),0);
        }
        
        for(var i = 0; i<140; i++){
            var rad = 0.5+pow(random(0.8,1.4),3);
            var colShift = random(0,100);
            if(random(0,1)<0.2){rad*=random(1,2);}
            solids.push(Bouncer.new(random(-15,15),rad*oneOf(1,2.3),random(2,35),rad,random(0,360),[150+colShift,80,150-colShift,255]));
            var currentId = solids.length-1;
            for(var j = 0; j<currentId; j++){
                if(solids[j].constructor.name==="Bouncer"){
                    if(dist(solids[currentId].x,solids[currentId].z,solids[j].x,solids[j].z)<(solids[currentId].rad+solids[j].rad)){
                        solids.pop();
                        break;
                    }
                }
            }
        }
        solids.push(Bouncer.new(0,4,17,4.5,8,[244,211,244,255]));
        var currentId = solids.length-1;
        for(var j = currentId-2; j>-1; j--){
            if(solids[j].constructor.name==="Bouncer"){
                if(dist(solids[currentId].x,solids[currentId].z,solids[j].x,solids[j].z)<6){
                    solids.splice(j,1);
                    currentId--;
                }
            }
        }
        
        
        solids.push(Block.new(22,0.1,7,4.5,0.1,2,20,[0,0,55,255]));
        solids.push(Block.new(30,1,11,1,1,1,70,[0,0,110,255]));
        solids.push(Block.new(30,2,16,0.1,2,0.4,85,[0,0,170,255]));
        solids.push(Block.new(22,3,17,2,3,3,40,[0,0,195,255]));
        solids.push(Block.new(24,7.5,25.5,1.2,0.3,0.4,45,[0,0,235,255]));
        solids.push(Block.new(24,3.6,25.5,0.3,3.6,0.3,0,[0,0,235,255]));
        solids.push(Block.new(32.3,6.9,26.8,1,2.8,1,5,[10,10,255,255]));
        
        for(var i = 0; i<5; i++){
            solids.push(Pole.new(-25,0.7+1.5*i,8+13*pow(i,0.83),6.3-1.5*i,0.7,5+i*3,[265-i*20,120+pow(i,1.25)*25,0,255]));
        }
        
        solids.push(Pole.new(player.x,player.y-1,player.z,0.1,1,0,[0,0,0]));
    },
    function(){
        graphics = [];
        graphicOrders = [];
        lightSources = [];
        lightVectors = [];
        colliders = [];
        
        
        
        for(var i = 0; i<solids.length; i++){
            solids[i].makeCollider();
        }
        
        colliders.push({idTag:-1,
            x:0,y:0,z:0,
            planeNorm:{x:0,y:1,z:1},
            type:"slp",
            giveJumpFunc:giveJump,
        }); // slope collider
        colliders.push({idTag:-1,
            x:0,y:0,z:0,
            planeNorm:{x:0,y:1,z:0},
            type:"slp",
            giveJumpFunc:giveJump,
        }); // floor collider
        
        playerAndCameraManagement();
        
        // createLightSource(5*cos(ganime),4.5+2*sin(ganime*3),5*sin(ganime),2,3,2);
        // createLightSource(5*cos(ganime+120),4.5+2*sin(ganime*3+120),5*sin(ganime+120),2,3,2);
        createLightVector({x:0.1,y:-1,z:0.2},1,0.1);
        
        
        if(drawQuad({
            v1:{x:c.x-1e10*(c.y+1),y:0,z:0},
            v2:{x:c.x+1e10*(c.y+1),y:0,z:0},
            v3:{x:c.x+1e10*(c.y+1),y:1e10+(c.y+1),z:-1e10-(c.y+1)},
            v4:{x:c.x-1e10*(c.y+1),y:1e10+(c.y+1),z:-1e10-(c.y+1)},
            col:[75,75,85],
        },true)){graphics[graphics.length-1].depth=1e10;}
        drawLattice(0,5,7,0.6,[70,70,80,160],false);
        drawFloor(-0.000001,[75,75,85],false);
        
        for(var i = 0; i<solids.length; i++){
            solids[i].draw();
        }
    
        for(var i = 0; i<stars.length; i++){
            drawStar(pCopy(stars[i]));
        }
        
        if(player.pov===2){
            player.animate();
            player.draw(0);
        }
        else if(player.pov>=3){
            player.animate();
            player.draw(0.4);
        }
        
        push();
        translate(width/2,height/2);
        scale(1,-1);
        background(100,200,255);
        noStroke();
        
        displayGraphics();
        
        if(player.pov===1){
            drawCrossHair();
        }
        
        pop();
    },
    function(){
        oiers = [];
        solids = [];
        items = [];
        mannequins = [];
    }
),



Level.new(
    "First Dream",
    function(){
        resetPlayerAndCameraTo(0,0,0, 0,0,0);
        stars = [];
        for(var i = 0; i<140; i++){
            stars.push({x:0,y:0,z:random(10000,45000)});
            angRotatePointTEA(stars[i],origin,random(0,360),random(0,oneOf(-0.95,0.95)*acos(random(0,0.99999))),0);
        }
        
        solids.push(Block.new(0,-1,0,1,1,1,45,[0,200,0]));
        solids.push(Block.new(1,-1,8,1,1,1,45,[0,200,0]));
        solids.push(Block.new(4,-1,16,1,1,1,45,[0,200,0]));
        solids.push(Block.new(6,-1,24,1,1,1,45,[0,200,0]));
        solids.push(Block.new(3,-1,32,1,1,1,45,[0,200,0]));
        solids.push(Block.new(-2,-1,40,1,1,1,45,[0,200,0]));
        solids.push(Block.new(-4,-1,48,1,1,1,45,[0,200,0]));
        solids.push(Block.new(1,-1,56,1,1,1,45,[0,200,0]));
        solids.push(Block.new(-1,-1,62,1,1,1,45,[0,200,0]));
        solids.push(Block.new(-0.5,-1,73,1,1,1,45,[0,200,0]));
        
        portals.push(Portal.new(0,2,77,0,function(){
            switchToLevel(findLevel("Boing Boing"));
        },[255,0,255]));
    },
    function(){
        graphics = []; graphicOrders = []; lightSources = []; lightVectors = []; colliders = [];
        
        for(var i = 0; i<solids.length; i++){
            solids[i].makeCollider();
        }
        
        playerAndCameraManagement();
        
        createLightVector({x:0,y:-1,z:0},0.3,0.07);
        //drawFloor(-1e9,[0,0,0],true);
        for(var i = 0; i<solids.length; i++){
            solids[i].draw();
        }
        for(var i = 0; i<portals.length; i++){
            portals[i].draw();
        }
        for(var i = 0; i<stars.length; i++){
            drawStar(pCopy(stars[i]),1);
        }
        
        if(player.pov===2){
            player.animate();
            player.draw(0);
        }
        else if(player.pov>=3){
            player.animate();
            player.draw(0.4);
        }
        
        push(); translate(width/2,height/2); scale(1,-1); noStroke();
        background(20,0,60);
        displayGraphics();
        if(player.pov===1){drawCrossHair();}
        pop();
        
        if(player.y+player.eyeLevel*0.7<=-4){
            player.die();
            player.elevation=-30;
        }
        else{
            for(var i = 0; i<portals.length; i++){
                portals[i].operate();
            }
        }
    },
    function(){
        oiers = [];
        solids = [];
        items = [];
        mannequins = [];
        stars = [];
        portals = [];
    }
),
Level.new(
    "Trees Don't Die",
    function(){
        resetPlayerAndCameraTo(1,0,-4, -20,0,0);
        
        for(var i = 0; i<6; i++){
            solids.push(MediumTree.new(5+sin(i*120-200)*4,0,pow(i+0.5,1.6)*3.2-2,1.2+i*0.7,i*50+130*(i===5),90,max(6+7*i,27),1.8+i/2,1+i,[160,100,20],[20,140,35],25));
        }
        
        portals.push(Portal.new(9,19,54,0,function(){
            switchToLevel(findLevel("Trees Don't Die"));
        },[0,255,0]));
    },
    function(){
        graphics = []; graphicOrders = []; lightSources = []; lightVectors = []; colliders = [];
        
        for(var i = 0; i<solids.length; i++){
            solids[i].makeCollider();
        }
        colliders.push({idTag:-1,x:0,y:0,z:0,planeNorm:{x:0,y:1,z:0},type:"slp",giveJumpFunc:giveJump,});// floor
        
        playerAndCameraManagement();
        
        createLightVector({x:0.1,y:-1,z:-0.3},1.15,0.15);
        //drawFloor(-1e9,[0,0,0],true);
        drawLattice(0,5,7,0.6,[50,150,30,100],false);
        drawFloor(-0.000001,[60,160,40],false);
        for(var i = 0; i<solids.length; i++){
            solids[i].draw();
        }
        for(var i = 0; i<portals.length; i++){
            portals[i].draw();
        }
        
        if(player.pov===2){
            player.animate();
            player.draw(0);
        }
        else if(player.pov>=3){
            player.animate();
            player.draw(0.4);
        }
        
        push(); translate(width/2,height/2); scale(1,-1); noStroke();
        background(0, 205, 255);
        displayGraphics();
        if(player.pov===1){drawCrossHair();}
        pop();
    
        for(var i = 0; i<portals.length; i++){
            portals[i].operate();
        }
    },
    function(){
        oiers = [];
        solids = [];
        items = [];
        mannequins = [];
        portals = [];
    }
),
Level.new(
    "Trees Do Die",
    function(){
        resetPlayerAndCameraTo(1,0,-4, -20,0,0);
        
        for(var i = 0; i<7; i++){
            solids.push(MediumTree.new(5+sin(i*120-200)*4,0,pow(i+0.5,1.8)*2.3-2+3*(i===6),1.2+i*0.7,i*45-(i===5)*30,90+35*(i===5),4+i,1.8+i/2,1+i,[160,140,120],[240,245,255],0));
        }
        portals.push(Portal.new(7.5,19,74,0,function(){
            switchToLevel(findLevel("Trees Do Die"));
        },[130,130,255]));
    },
    function(){
        graphics = []; graphicOrders = []; lightSources = []; lightVectors = []; colliders = [];
        
        for(var i = 0; i<solids.length; i++){
            solids[i].makeCollider();
        }
        colliders.push({idTag:-1,x:0,y:0,z:0,planeNorm:{x:0,y:1,z:0},type:"slp",giveJumpFunc:giveJump,});// floor
        
        playerAndCameraManagement();
        
        createLightVector({x:0.1,y:-1,z:-0.3},0.85,0.15);
        //drawFloor(-1e9,[0,0,0],true);
        drawLattice(0,5,7,0.6,[200,230,240,100],false);
        drawFloor(-0.000001,[230,240,250],false);
        for(var i = 0; i<solids.length; i++){
            solids[i].draw();
        }
        for(var i = 0; i<portals.length; i++){
            portals[i].draw();
        }
        
        if(player.pov===2){
            player.animate();
            player.draw(0);
        }
        else if(player.pov>=3){
            player.animate();
            player.draw(0.4);
        }
        
        push(); translate(width/2,height/2); scale(1,-1); noStroke();
        background(120, 190, 230);
        displayGraphics();
        if(player.pov===1){drawCrossHair();}
        pop();
        
        for(var i = 0; i<portals.length; i++){
            portals[i].operate();
        }
    },
    function(){
        oiers = [];
        solids = [];
        items = [];
        mannequins = [];
        portals = [];
    }
),
Level.new(
    "Boing Boing",
    function(){
        resetPlayerAndCameraTo(0,0,0, 0,0,0);
        stars = [];
        for(var i = 0; i<140; i++){
            stars.push({x:0,y:0,z:random(10000,45000)});
            angRotatePointTEA(stars[i],origin,random(0,360),random(0,oneOf(-0.95,0.95)*acos(random(0,0.99999))),0);
        }
        
        solids.push(Bouncer.new(0,-3,0,3.8,random(0,360),[0,0,255]));
        solids.push(Bouncer.new(2,-3,10,3.8,random(0,360),[0,0,255]));
        solids.push(Bouncer.new(-1,-3,25,3.8,random(0,360),[0,0,255]));
        solids.push(Bouncer.new(4,-3,42,3.8,random(0,360),[0,0,255]));
        
        portals.push(Portal.new(6,-7,57,0,function(){
            
            switchToLevel(findLevel("Boing Boing"));
        },[255,0,255]));
    },
    function(){
        graphics = []; graphicOrders = []; lightSources = []; lightVectors = []; colliders = [];
        
        for(var i = 0; i<solids.length; i++){
            solids[i].makeCollider();
        }
        
        playerAndCameraManagement();
        
        createLightVector({x:0,y:-1,z:0},0.3,0.07);
        //drawFloor(-1e9,[0,0,0],true);
        for(var i = 0; i<solids.length; i++){
            solids[i].draw();
        }
        for(var i = 0; i<portals.length; i++){
            portals[i].draw();
        }
        for(var i = 0; i<stars.length; i++){
            drawStar(pCopy(stars[i]),1);
        }
        
        if(player.pov===2){
            player.animate();
            player.draw(0);
        }
        else if(player.pov>=3){
            player.animate();
            player.draw(0.4);
        }
        
        push(); translate(width/2,height/2); scale(1,-1); noStroke();
        background(20,0,60);
        displayGraphics();
        if(player.pov===1){drawCrossHair();}
        pop();
        
        if(player.y+player.eyeLevel*0.7<=-7){
            player.die();
            player.elevation=-30;
        }
        else{
            for(var i = 0; i<portals.length; i++){
                portals[i].operate();
            }
        }
    },
    function(){
        oiers = [];
        solids = [];
        items = [];
        mannequins = [];
        stars = [];
        portals = [];
    }
),
Level.new(
    "Walking on Pillars",
    function(){
        resetPlayerAndCameraTo(0,10,-1.5, 0,0,0);
        
        //solids.push(Bouncer.new(4,3,42,3.8,random(0,360),[0,0,255]));
        solids.push(SurfacePillar.new(0,0,0,2.4,9.9,1,random(0,360),[130,100,70]));
        solids.push(SurfacePillar.new(-0.5,0,12.5,1,4,1,random(0,360),[130,100,70]));
        solids.push(SurfacePillar.new(0.5,0,23,1,1,1,random(0,360),[130,100,70]));
        solids.push(SurfacePillar.new(-4,0,27,1,2,1,random(0,360),[130,100,70]));
        solids.push(SurfacePillar.new(1,0,31,1,3,1,random(0,360),[130,100,70]));
        solids.push(SurfacePillar.new(8,0,35,1,4,1,random(0,360),[130,100,70]));
        solids.push(SurfacePillar.new(7,0,40,1,4,1,random(0,360),[130,100,70]));
        solids.push(SurfacePillar.new(-3.5,0,40,1,1,1,random(0,360),[130,100,70]));
        solids.push(SurfacePillar.new(-2.5,0,47,1,3,1,random(0,360),[130,100,70]));
        solids.push(SurfacePillar.new(-0.5,0,53,1,5,1,random(0,360),[130,100,70]));
        solids.push(SurfacePillar.new(0,0,62,1,3.5,1,random(0,360),[130,100,70]));
        
        this.lavaPlates = [];
        for(var i = 0; i<100; i++){
            this.lavaPlates.push(LavaPlate.new(random(-50,50),0.00001,random(0,120),oneOf(-1,1)*random(0.01,0.03),oneOf(-1,1)*random(0.02,0.04),random(0,360),random(100,250),1.8,[250,130,0]));
        }
        for(var i = 0; i<50; i++){
            this.lavaPlates.push(LavaPlate.new(random(-50,50),0.00001,random(0,120),oneOf(-1,1)*random(0.01,0.02),oneOf(-1,1)*random(0.02,0.04),random(0,360),random(100,500),3.2,[245,90,0]));
        }
        portals.push(Portal.new(0,6.5,62,0,function(){
            switchToLevel(findLevel("Waking up Pillars"));
        },[270,200,0]));
    },
    function(){
        graphics = []; graphicOrders = []; lightSources = []; lightVectors = []; colliders = [];
        
        
        // pillars dont need to operate, they're all static
        for(var i = 0; i<solids.length; i++){
            solids[i].makeCollider();
        }
        
        playerAndCameraManagement();
        
        createLightVector({x:cos(ganime*2),y:1.25,z:sin(ganime*2)},0.7,0.3);
        createLightVector({x:cos(ganime*2+140),y:1.25,z:sin(ganime*2+150)},0.9,0);
        drawFloor(0,[245,110,0],false);
        for(var i = this.lavaPlates.length-1; i>-1; i--){
            this.lavaPlates[i].drift();
            this.lavaPlates[i].draw();
            if(this.lavaPlates[i].lifetime<=0){
                //this.lavaPlates.splice(i,1);
                this.lavaPlates[i].respawn(45);
            }
        }
        for(var i = 0; i<solids.length; i++){
            solids[i].draw();
        }
        for(var i = 0; i<portals.length; i++){
            portals[i].draw();
        }
        
        if(player.pov===2){
            player.animate();
            player.draw(0);
        }
        else if(player.pov>=3){
            player.animate();
            player.draw(0.4);
        }
        
        push(); translate(width/2,height/2); scale(1,-1); noStroke();
        background(0, 0, 0);
        displayGraphics();
        if(player.pov===1){drawCrossHair();}
        pop();
        
        if(player.y+player.eyeLevel*0.7<=0){
            player.die();
            player.elevation=-30;
        }
        else{
            for(var i = 0; i<portals.length; i++){
                portals[i].operate();
            }
        }
    },
    function(){
        oiers = [];
        this.lavaPlates = [];
        solids = [];
        items = [];
        portals = [];
        mannequins = [];
    }
),
Level.new(
    "Waking up Pillars",
    function(){
        resetPlayerAndCameraTo(0,10,-1.5, 0,0,0);
        setGoToPoint(camera,player);
        player.azimuth = player.elevation = player.twist = 0;
        
        //solids.push(Bouncer.new(4,3,42,3.8,random(0,360),[0,0,255]));
        solids.push(SurfacePillar.new(0,0,0,2.4,9.9,1,random(0,360),[130,100,70]));
        solids.push(SurfacePillar.new(-0.5,0,12.5,1,4,0,random(0,360),[260,215,180]));
        solids.push(SurfacePillar.new(0.5,0,23,1,1,0,random(0,360),[260,215,180]));
        solids.push(SurfacePillar.new(-4,0,27,1,2,0,random(0,360),[260,215,180]));
        solids.push(SurfacePillar.new(1,0,31,1,3,0,random(0,360),[260,215,180]));
        solids.push(SurfacePillar.new(8,0,35,1,4,0,random(0,360),[260,215,180]));
        solids.push(SurfacePillar.new(7,0,40,1,4,0,random(0,360),[260,215,180]));
        solids.push(SurfacePillar.new(-3.5,0,40,1,1,0,random(0,360),[260,215,180]));
        solids.push(SurfacePillar.new(-2.5,0,47,1,3,0,random(0,360),[260,215,180]));
        solids.push(SurfacePillar.new(-0.5,0,53,1,5,0,random(0,360),[260,215,180]));
        this.pillarCount = solids.length; // do not add pillars after this or they will be static
        solids.push(SurfacePillar.new(0,0,62,1,3.5,1,random(0,360),[130,100,70]));
        
        
        this.lavaPlates = [];
        for(var i = 0; i<40; i++){
            this.lavaPlates.push(LavaPlate.new(random(-50,50),0.00001,random(0,120),oneOf(-1,1)*random(0.01,0.03),oneOf(-1,1)*random(0.02,0.04),random(0,360),random(150,350),1.8,[250,130,0]));
        }
        for(var i = 0; i<110; i++){
            this.lavaPlates.push(LavaPlate.new(random(-50,50),0.00001,random(0,80),oneOf(-1,1)*random(0.01,0.02),oneOf(-1,1)*random(0.02,0.04),random(0,360),random(100,200),3.2,[245,90,0]));
        }
        portals.push(Portal.new(0,6.5,62,0,function(){
            switchToLevel(findLevel("Waking up Pillars"));
        },[270,200,0]));
    },
    function(){
        graphics = []; graphicOrders = []; lightSources = []; lightVectors = []; colliders = [];
        
        var growMag = 0, growNextMag = 0;
        for(var i = 0; i<this.pillarCount; i++){
            solids[i].operate();
            var d = dist(player.x+player.xv*3,player.z+player.zv*3,solids[i].x,solids[i].z);
            growMag = growNextMag;
            growNextMag = 0;
            if(d<4){
                if(solids[i].h<solids[i].hMax*0.65){growMag=max(growMag,0.35);}
                else{growMag=max(growMag,0.12);}
                if(i+1<this.pillarCount&&d<solids[i].rad+0.5){growNextMag=0.08;}
            }
            else if(solids[i].h>0&&solids[i].h<solids[i].hMax){
                growMag=max(growMag,0.04);
            }
            var grownH = solids[i].grow(growMag);
            if(grownH>0){
                for(var j = 0; j<this.lavaPlates.length; j++){
                    var pushMag = sqrt(grownH)*constrain(4/(dist(this.lavaPlates[j].x,this.lavaPlates[j].z,solids[i].x,solids[i].z)+1.5),0,1);
                    if(pushMag){
                        var pushAng = atan2(this.lavaPlates[j].z-solids[i].z,this.lavaPlates[j].x-solids[i].x);
                        this.lavaPlates[j].x+=pushMag*cos(pushAng);
                        this.lavaPlates[j].z+=pushMag*sin(pushAng);
                        // this.lavaPlates[j].xv+=pushMag*cos(pushAng)*0.02;
                        // this.lavaPlates[j].zv+=pushMag*sin(pushAng)*0.02;
                    }
                }
            }
        }
        for(var i = 0; i<solids.length; i++){
            solids[i].makeCollider();
        }
        
        playerAndCameraManagement();
        
        createLightVector({x:cos(ganime*2),y:1.25,z:sin(ganime*2)},0.7,0.3);
        createLightVector({x:cos(ganime*2+140),y:1.25,z:sin(ganime*2+150)},0.9,0);
        drawFloor(0,[245,110,0],false);
        for(var i = this.lavaPlates.length-1; i>-1; i--){
            this.lavaPlates[i].drift();
            this.lavaPlates[i].draw();
            if(this.lavaPlates[i].lifetime<=0){
                //this.lavaPlates.splice(i,1);
                this.lavaPlates[i].respawn(35);
            }
        }
        for(var i = 0; i<solids.length; i++){
            solids[i].draw();
        }
        for(var i = 0; i<portals.length; i++){
            portals[i].draw();
        }
        
        if(player.pov===2){
            player.animate();
            player.draw(0);
        }
        else if(player.pov>=3){
            player.animate();
            player.draw(0.4);
        }
        
        push(); translate(width/2,height/2); scale(1,-1); noStroke();
        background(0, 0, 0);
        displayGraphics();
        if(player.pov===1){drawCrossHair();}
        pop();
        
        if(player.y+player.eyeLevel*0.7<=0){
            player.die();
            player.elevation=-30;
        }
        else{
            for(var i = 0; i<portals.length; i++){
                portals[i].operate();
            }
        }
    },
    function(){
        oiers = [];
        this.lavaPlates = [];
        solids = [];
        items = [];
        mannequins = [];
        portals = [];
    }
),
Level.new(
    "Suspiciously Warm Cliff",
    function(){
        resetPlayerAndCameraTo(0,104.1,-4, 0,-30,0);
        this.playerCrossed = false;
        
        solids.push(SurfacePillar.new(0,50,36,2.8,9.9,1,random(0,360),[130,115,110]));
        solids.push(SurfacePillar.new(0,50,45,1,9.9,1,random(0,360),[130,115,110]));
        solids.push(SurfacePillar.new(0,50,54,1,9.9,1,random(0,360),[130,115,110]));
        solids.push(SurfacePillar.new(0,50,65,1.6,1,1,random(0,360),[130,115,110]));
        this.growPillarsCd = 85;
        this.firstGrowingPillarId = solids.length;
        solids.push(SurfacePillar.new(-6.2,50,73,0.6,20,0.02,random(0,360),[260,215,180]));
        solids.push(SurfacePillar.new(7.1,50,73,2.8,20,0.145,random(0,360),[260,215,180]));
        
        solids.push(SurfacePillar.new(0,50,77,0.4,21,1,random(0,360),[130,115,110]));
        
        this.lavaPlates = [];
        for(var i = 0; i<80; i++){
            this.lavaPlates.push(LavaPlate.new(random(-250,250),50,random(35,350),oneOf(-1,1)*random(0.01,0.03),oneOf(-1,1)*random(0.02,0.04),random(0,360),random(150,350),2,[250,135,0]));
        }
        for(var i = 0; i<100; i++){
            this.lavaPlates.push(LavaPlate.new(random(-250,250),50,random(35,350),oneOf(-1,1)*random(0.01,0.02),oneOf(-1,1)*random(0.02,0.04),random(0,360),random(150,350),3.3,[245,84,0]));
        }
        portals.push(Portal.new(0,73.5,77,0,function(){
            switchToLevel(findLevel("Walking on Pillars"));
        },[270,200,0]));
    },
    function(){
        graphics = [];
        graphicOrders = [];
        lightSources = [];
        lightVectors = [];
        colliders = [];
        
        for(var i = this.firstGrowingPillarId; i<this.firstGrowingPillarId+2; i++){
            if(dist(player.x-player.xv*3,player.z-player.zv*3,solids[i].x,solids[i].z+0.1)<solids[i].rad+0.5){
                if(this.growPillarsCd<=50){
                    solids[i].grow(map(this.growPillarsCd,50,0,0,0.015));
                }
                if(this.growPillarsCd>0){
                    this.growPillarsCd--;
                }
            }
        }
        
        for(var i = 0; i<solids.length; i++){
            solids[i].makeCollider();
        }
        
        colliders.push({idTag:-1,
            x:0,y:0,z:0,
            planeNorm:{x:0,y:1,z:0},
            type:"slp",
            giveJumpFunc:giveJump,
        }); // floor collider
        
        // player.drift();
        
        if(player.z-player.rad>=20&&player.y<80){
            this.playerCrossed = true;
        }
        if(this.playerCrossed){
            if(player.z<=20+player.rad){
                if(player.y>80){
                    this.playerCrossed = false;
                }
                else{
                    player.zv=0;
                    player.z=20.00001+player.rad;
                }
            }
        }
        else{
            if(player.z-player.rad<0){
                colliders.push({idTag:-1,
                    x:0,y:100,z:0,
                    planeNorm:{x:0,y:1,z:0.5},
                    type:"slp",
                    giveJumpFunc:giveJump,
                }); // shallow slope
            }
            else if(player.z-player.rad<20){
                colliders.push({idTag:-1,
                    x:0,y:100,z:0,
                    planeNorm:{x:0,y:1,z:1},
                    type:"slp",
                    giveJumpFunc:giveJump,
                }); // deeper slope
            }
        }
        
        playerAndCameraManagement();
        // player.interactWithColliders(false,true); player.operate();
        // // if(player.canJump){player.gravity(0.0125);}
        // // else{player.gravity(0.014);}
        // player.gravity(0.015);
        // c.syncToPlayer(); c.viewControl(); c.getComplexes();
        // if(c.canResetFOV){c.adjustFOVToRanges(width/height,1);}
        
        createLightVector({x:0,y:-1,z:0},0.25,0);
        createLightVector({x:cos(ganime*2),y:1.4,z:sin(ganime*2)},0.45,0.4);
        createLightVector({x:cos(ganime*2+140),y:1.4,z:sin(ganime*2+150)},0.65,0);
        drawFloor(50,[245,110,0],false);
        if(drawQuad({
            v1:{x:-1e10,y:100,z:0},
            v2:{x:1e10,y:100,z:0},
            v3:{x:1e10,y:100+5e10,z:-1e11},
            v4:{x:-1e10,y:100+5e10,z:-1e11},
            col:[65,65,85],
        },false)){
            if(c.z<0){
                graphics[graphics.length-1].depth=3.9;
            }
            else{
                graphics[graphics.length-1].depth=5e10;
            }
        }
        if(drawQuad({
            v1:{x:1e10,y:100,z:0},
            v2:{x:-1e10,y:100,z:0},
            v3:{x:-1e10,y:80,z:20},
            v4:{x:+1e10,y:80,z:20},
            col:[50,50,65],
        },false)){
            if(c.z<20){
                graphics[graphics.length-1].depth=4.2;
            }
            else{
                graphics[graphics.length-1].depth=4e10;
            }
        }
        if(c.z>20&&drawQuad({
            v1:{x:1e10,y:80,z:20},
            v2:{x:-1e10,y:80,z:20},
            v3:{x:-1e10,y:50,z:20},
            v4:{x:+1e10,y:50,z:20},
            col:[85,65,65],
        },false)){
            graphics[graphics.length-1].depth=1e10;
        }
        for(var i = -16; i<=16; i+=8){
            if(drawQuad({
                v1:{x:i-1.5,y:100,z:0},
                v2:{x:i+1.5,y:100,z:0},
                v3:{x:i+1.5,y:100+5e10,z:-1e11},
                v4:{x:i-1.5,y:100+5e10,z:-1e11},
                col:[70,70,90],
            },false)){
                if(c.z<0){
                    graphics[graphics.length-1].depth=3.8;
                }
                else{
                    graphics[graphics.length-1].depth=5e10;
                }
            }
            if(drawQuad({
                v1:{x:i+1.5,y:100,z:0},
                v2:{x:i-1.5,y:100,z:0},
                v3:{x:i-1.5,y:80,z:20},
                v4:{x:i+1.5,y:80,z:20},
                col:[60,60,75],
            },false)){
                if(c.z<20){
                    graphics[graphics.length-1].depth=4.1;
                }
                else{
                    graphics[graphics.length-1].depth=4e10;
                }
            }
            if(c.z>20&&drawTriangle({
                v1:{x:i+1.5,y:80,z:20},
                v2:{x:i-1.5,y:80,z:20},
                v3:{x:i,y:75,z:20},
                col:[98,75,75],
            },false)){
                graphics[graphics.length-1].depth=1e10;
            }
        }
        
        for(var i = 0; i<solids.length; i++){
            solids[i].draw();
        }
        for(var i = this.lavaPlates.length-1; i>-1; i--){
            this.lavaPlates[i].drift();
            this.lavaPlates[i].draw();
            if(this.lavaPlates[i].lifetime<=0){
                //this.lavaPlates.splice(i,1);
                this.lavaPlates[i].lifetime=this.lavaPlates[i].maxLifetime;
                if(this.playerCrossed){
                    this.lavaPlates[i].x=random(-90,90);
                    this.lavaPlates[i].z=random(40,250);
                }
                else{
                    this.lavaPlates[i].x=random(-200,200);
                    this.lavaPlates[i].z=random(40,300);
                }
            }
        }
        for(var i = 0; i<portals.length; i++){
            portals[i].draw();
        }
        
        if(player.pov===2){
            player.animate();
            player.draw(0);
        }
        else if(player.pov>=3){
            player.animate();
            player.draw(0.4);
        }
        
        push();
        translate(width/2,height/2);
        scale(1,-1);
        background(135, 187, 230);
        noStroke();
        
        displayGraphics();
        
        if(player.pov===1){
            drawCrossHair();
        }
        
        pop();
        
        if(player.y+player.eyeLevel*0.7<=50){
            player.die();
            player.elevation=-30;
        }
        else{
            for(var i = 0; i<portals.length; i++){
                portals[i].operate();
            }
        }
    },
    function(){
        oiers = [];
        solids = [];
        items = [];
        mannequins = [];
        this.lavaPlates = [];
        this.playerCrossed = false;
        this.growPillarsCd = 100;
        this.firstGrowingPillarId = -1;
        portals = [];
    }
),
Level.new(
    "NPCity",
    function(){
        resetPlayerAndCameraTo(-6,0,-3, -45,0,0);
        this.npcs = [];
        this.npcs.push(Mannequin.new(-5,0,0,0.7,-45,0,0,[[160,160,160],[255,170,165],[160,160,160],[160,160,160],[70,120,190],[70,120,190]],100,function(){},function(){
            var ted = this;
            ted.bodyFrame = argsGenerateBodyFrame(
                ted.x,ted.y+ted.eyeLevel+0.12,ted.z,
                [ted.bodyScale*0.45,ted.bodyScale*1,ted.bodyScale*1.3,ted.bodyScale*1.5,ted.bodyScale*0.45,ted.bodyScale*1.5],
                bodyFrameUArgsGenerators.lift(ganime%60/60,ted.azimuth),
                bodyFrameLArgsGenerators.run(ganime%45/45,10)
            );
        },function(){}));
        this.npcs.push(Mannequin.new(0,0,-2.5,0.7,-25,0,0,[[160,160,160],[235,235,250],[160,160,160],[160,160,160],[70,120,190],[70,120,190]],100,function(){},function(){
            var ted = this;
            ted.bodyFrame = argsGenerateBodyFrame(
                ted.x,ted.y+ted.eyeLevel+0.12,ted.z,
                [ted.bodyScale*0.45,ted.bodyScale*1,ted.bodyScale*1.3,ted.bodyScale*1.5,ted.bodyScale*0.45,ted.bodyScale*1.5],
                bodyFrameUArgsGenerators.demoDance(ganime%180/180,ted.azimuth),
                bodyFrameLArgsGenerators.stand(0)
            );
        },function(){}));
        this.npcs.push(Mannequin.new(5,0,0,0.7,135,0,0,[[160,160,160],[50,50,50],[160,160,160],[160,160,160],[70,120,190],[70,120,190]],100,function(){},function(){
            var ted = this;
            ted.bodyFrame = argsGenerateBodyFrame(
                ted.x,ted.y+ted.eyeLevel+0.12,ted.z,
                [ted.bodyScale*0.45,ted.bodyScale*1,ted.bodyScale*1.3,ted.bodyScale*1.5,ted.bodyScale*0.45,ted.bodyScale*1.5],
                bodyFrameUArgsGenerators.clap(ganime%90/90,ted.azimuth),
                bodyFrameLArgsGenerators.stand(0)
            );
        },function(){}));
        this.npcs.push(Mannequin.new(-3,0,-5,0.7,-30,0,0,[[160,160,160],[100,150,100],[160,160,160],[160,160,160],[80,80,80],[80,80,80]],100,function(){},function(){
            var ted = this;
            ted.bodyFrame = argsGenerateBodyFrame(
                ted.x,ted.y+ted.eyeLevel+0.12,ted.z,
                [ted.bodyScale*0.45,ted.bodyScale*1,ted.bodyScale*1.3,ted.bodyScale*1.5,ted.bodyScale*0.45,ted.bodyScale*1.5],
                bodyFrameUArgsGenerators.salute(constrain(0.5+1*sin(ganime*2),0,1),ted.azimuth),
                bodyFrameLArgsGenerators.stand(0)
            );
        },function(){}));
        this.npcs.push(Mannequin.new(3,0,-5,0.7,45,0,0,[[160,160,160],[220,90,50],[160,160,160],[160,160,160],[40,60,80],[40,60,80]],100,function(){},function(){
            var ted = this;
            ted.bodyFrame = argsGenerateBodyFrame(
                ted.x,ted.y+ted.eyeLevel+0.12,ted.z,
                [ted.bodyScale*0.45,ted.bodyScale*1,ted.bodyScale*1.3,ted.bodyScale*1.5,ted.bodyScale*0.45,ted.bodyScale*1.5],
                bodyFrameUArgsGenerators.swirl(ganime%60/60,ted.azimuth),
                bodyFrameLArgsGenerators.stand(0)
            );
        },function(){}));
        this.npcs.push(Mannequin.new(0,0,-8,0.7,0,0,0,[[160,160,160],[235,235,190],[160,160,160],[160,160,160],[230,230,230],[230,230,230]],100,function(){},function(){
            var ted = this;
            ted.bodyFrame = argsGenerateBodyFrame(
                ted.x,ted.y+ted.eyeLevel+0.12,ted.z,
                [ted.bodyScale*0.45,ted.bodyScale*1,ted.bodyScale*1.3,ted.bodyScale*1.5,ted.bodyScale*0.45,ted.bodyScale*1.5],
                bodyFrameUArgsGenerators.disapproval(ganime%120/120,ted.azimuth),
                bodyFrameLArgsGenerators.stand(0)
            );
        },function(){}));
        
        solids.push(MediumTree.new(0,0,5,2,0,90,25,2.5,71,[160,100,20],[20,140,35],25));
        //(x,y,z,h,azimuth,elevation,generationTries,generationRad,seed,trunkCol,leafCol,leafColVariation)
    },
    function(){
        graphics = []; graphicOrders = []; lightSources = []; lightVectors = []; colliders = [];
        
        for(var i = 0; i<solids.length; i++){
            solids[i].makeCollider();
        }
        for(var i = 0; i<this.npcs.length; i++){
            this.npcs[i].makeCollider();
        }
        colliders.push({idTag:-1,x:0,y:0,z:0,planeNorm:{x:0,y:1,z:0},type:"slp",giveJumpFunc:giveJump,});// floor
        
        playerAndCameraManagement();
        
        createLightVector({x:0.1,y:-1,z:0.2},1,0.1);
        drawLattice(0,5,7,0.6,[70,70,80,160],false);
        drawFloor(-0.000001,[75,75,85],false);
        
        for(var i = 0; i<solids.length; i++){
            solids[i].draw();
        }
        for(var i = 0; i<this.npcs.length; i++){
            this.npcs[i].exist();
            if(this.npcs[i].testDeath()){this.npcs.splice(i,1);i--;}
        }
        
        
        
        
        
        
        
        if(player.pov===2){
            player.animate();
            player.draw(0);
        }
        else if(player.pov>=3){
            player.animate();
            player.draw(0.4);
        }
        
        push(); translate(width/2,height/2); scale(1,-1); noStroke();
        background(100,200,255);
        displayGraphics();
        if(player.pov===1){drawCrossHair();}
        pop();
    },
    function(){
        oiers = [];
        solids = [];
        items = [];
        mannequins = [];
        this.npcs = [];
        portals = [];
    }
),
Level.new(
    "SmhSphereSpiral",
    function(){
        
        resetPlayerAndCameraTo(0,10,0, -45,0,0);
        // solids.push(MediumTree.new(0,0,5,2,0,90,25,2.5,71,[160,100,20],[20,140,35],25));
        
        //////// old gen method is bad bc only one y level
        // for(var y = 0; y<60; y++){
        //     for(var x = 0; x<60; x++){
        //         // if((dst>r-0.9&&dst<r+0.9)&&ang+1>=((index*45)%360)&&ang-1<=((index*45)%360+9)){
        //         // }
        //         var ang = (720+atan2(y-30,x-30))%360;
        //         var dst = round(dist(x,y,30,30));
        //         var pitch = acos(dst/sphereRadius);
        //         var circleRadius = cos(pitch)*sphereRadius;
        //         var altitude = round(sin(pitch)*sphereRadius);
        //         var cycleNum = map(pitch,-90,90,0,72)+1;
        //         if((dst>circleRadius-0.9&&dst<circleRadius+0.9)&&abs((cycleNum*45)%360-ang)<100){
        //             // fill(map(altitude,0,20,0,255),0,map(altitude,0,20,255,0));
        //             // rect(x*10,y*10,10,10);
        //             solids.push(Block.new(x*2,2*altitude+1,y*2,1,1,1,0,[map(altitude,0,20,0,255),0,map(altitude,0,20,255,0)]));
        //         }
        //     }
        // }
        
        
                    var sphereRadius = 14; // SETTINGS FOR GEN
                    var twirlRate = 75;
        
        
        for(var elevation = -90; elevation<=90; elevation+=0.15){
            var circleRadius = sphereRadius*cos(elevation);
            var altitude = round(sin(elevation)*sphereRadius);
            var wantedAngle = map(elevation,-90,90,0,twirlRate)*45;
            var x = round(cos(wantedAngle)*circleRadius)*2;
            var y = (altitude+sphereRadius)*2+1;
            var z = round(sin(wantedAngle)*circleRadius)*2;
            var cancel = false;
            for(var i = 0; i<solids.length; i++){
                if(solids[i].x===x&&solids[i].y===y&&solids[i].z===z){
                    cancel = true;
                    // console.log(x+" "+y+" "+z);
                    break;
                }
            }
            if(!cancel){
                var blockcol = [map(altitude,-sphereRadius,sphereRadius,50,320),150*(x===0||z===0)+120*(x===0&&z>=0),255*(round(382.499999+atan2(z,x)/45)%2===0)];
                solids.push(Block.new(x,y,z,0.9,0.9,0.9,0,blockcol));
            }
        }
        solids.push(MediumTree.new(0,2+4*sphereRadius,0,3.6,0,90,30,3.3,71,[160,100,20],[20,140,35],25));//x,y,z,h,azimuth,elevation,generationTries,generationRad,seed,trunkCol,leafCol,leafColVariation
        this.low = 0;
        this.high = solids.length;
    },
    function(){
        graphics = []; graphicOrders = []; lightSources = []; lightVectors = []; colliders = [];
        
        for(var i = max(0,this.low); i<min(this.high,solids.length); i++){
            solids[i].makeCollider();
        }
        colliders.push({idTag:-1,x:0,y:0,z:0,planeNorm:{x:0,y:1,z:0},type:"slp",giveJumpFunc:giveJump,});// floor
        
        playerAndCameraManagement();
        
        createLightVector({x:0.1,y:-1,z:0.2},1,0.1);
        drawLattice(0,5,7,0.6,[70,70,80,240],false);
        drawFloor(-0.000001,[75,75,85],false);
        
        if(inp[49]){
            inp[49] = false;
            this.low--;
        }
        if(inp[50]){
            inp[50] = false;
            this.low++;
        }
        if(inp[51]){
            inp[51] = false;
            this.high--;
        }
        if(inp[52]){
            inp[52] = false;
            this.high++;
        }
        for(var i = max(0,this.low); i<min(this.high,solids.length); i++){
            solids[i].draw();
        }
        
        if(player.pov===2){
            player.animate();
            player.draw(0);
        }
        else if(player.pov>=3){
            player.animate();
            player.draw(0.4);
        }
        
        push(); translate(width/2,height/2); scale(1,-1); noStroke();
        background(100,200,255);
        displayGraphics();
        if(player.pov===1){drawCrossHair();}
        pop();
    },
    function(){
        oiers = [];
        solids = [];
        items = [];
        mannequins = [];
        this.npcs = [];
        portals = [];
    }
),
Level.new(
    "Climate Change",
    function(){
        if(this.playedSong===undefined){
            this.playedSong = true;
            playSongDontForget();
        }
        resetPlayerAndCameraTo(0,15,0, 0,0,0);
        this.voidHeight = 0;
        this.time = 0; // 0
        
        player.inv.boosts = 3;
        player.inv.coins = 0;
        player.boostCooldown = 10;
        
        
        stars = [];
        for(var i = 0; i<50; i++){
            stars.push({x:0,y:0,z:random(10000,45000)});
            angRotatePointTEA(stars[i],origin,random(0,360),random(0,0.96*acos(random(0,0.99999))),0);
        }
        
        
        
        var gennedPos = [{x:0,y:100,z:0},{x:31,y:100,z:0},{x:-31,y:100,z:0},{x:0,y:100,z:31},{x:0,y:100,z:-31}];
        for(var i = 0; i<50; i++){
            var genx = random(-28,28);
            var genz = random(-28,28);
            if(dist(genx,genz,0,0)<30){
                var cancel = false;
                for(var j = 0; j<gennedPos.length; j++){
                    if(dist(genx,genz,gennedPos[j].x,gennedPos[j].z)<7.7){
                        cancel = true;
                        break;
                    }
                }
                if(cancel){continue;}
                var geny = random(-2,0);
                var genh = random(3.5,5.5);
                gennedPos.push({x:genx,y:geny+genh*2.1,z:genz});
                solids.push(MediumTree.new(genx,geny,genz,genh,0,90,30,3.6,0,[190,130,50],[80,170,60],25));
            }
        }
        for(var i = 5; i<15&&i<gennedPos.length; i++){
            items.push(Coin.new(gennedPos[i].x,gennedPos[i].y+6.3,gennedPos[i].z));
        }
        solids.push(MediumTree.new(0,0,0,3.5,0,90,30,3.6,71,[160,100,20],[20,140,35],25));//x,y,z,h,azimuth,elevation,generationTries,generationRad,seed,trunkCol,leafCol,leafColVariation
        
        for(var i = 0; i<4; i++){
            solids.push(Slab.new(30*dirx[i],5,30*dirz[i],3.6,5,2.4,45+random(-20,20),[135,135,145]));
            solids.push(Slab.new(38*dirx[i]+8*dirz[i],6,38*dirz[i]+8*dirx[i],2.4,6,3.6,45+random(-20,20),[130,130,140]));
            solids.push(Slab.new(46*dirx[i],7,46*dirz[i],3.6,7,2.4,45+random(-20,20),[130,130,140]));
            solids.push(Slab.new(54*dirx[i]-8*dirz[i],8,54*dirz[i]-8*dirx[i],2.4,8,3.6,45+random(-20,20),[135,135,145]));
            solids.push(Slab.new(62*dirx[i],9,62*dirz[i],3.6,9,2.4,45+random(-20,20),[130,130,140]));
        }
    },
    function(){
        graphics = [];
        graphicOrders = [];
        lightSources = [];
        lightVectors = [];
        colliders = [];
        
        
        if(inp[84]){ // press t to speed
            this.voidHeight+=0.01*20;
            this.time+=20;
        }
        else{
            this.voidHeight+=0.01;
            this.time++;
        }
        if(this.time===1300){
            var fairyCol = [
                [255,150,0],
                [0,230,0],
                [0,130,230],
                [230,0,200],
            ];
            for(var i = 0; i<4; i++){
                oiers.push(PlatformFairy.new(dirx[i]*57+dirz[i]*4,19,dirz[i]*57+dirx[i]*4,atan2(dirx[i],dirz[i]),random(75,150),fairyCol[i]));
                // items.push(Boost.new(dirx[i]*57+dirz[i]*4,22,dirz[i]*57+dirx[i]*4));
            }
        }
        else if(this.time>1300){
            var platformFairyHealthSum = 0;
            for(var i = 0; i<oiers.length; i++){
                // console.log(oiers[i].constructor.name); //oier
                if(oiers[i].type==="PlatformFairy"){
                    platformFairyHealthSum+=oiers[i].hp-10;
                }
            }
            if(platformFairyHealthSum<120){
                var newcol = [random(40,255),random(40,240),random(40,255)];
                newcol[floor(random(0,3))] = 0;
                newcol[floor(random(0,3))] = 255;
                var nx = random(-50,50), ny = this.voidHeight+5, nz = random(-50,50);
                oiers.push(PlatformFairy.new(nx,ny,nz,random(0,360),random(70,125),newcol));
                // items.push(Boost.new(nx,ny+3,nz));
            }
        }
        
        for(var i = 0; i<solids.length; i++){
            var start = colliders.length;
            solids[i].makeCollider();
            var maxHeight=-12345;
            for(var j = start; j<colliders.length; j++){
                switch(colliders[j].type){
                    case "cyl":
                        maxHeight = max(maxHeight,colliders[j].y+colliders[j].h);
                        break;
                    case "sph":
                        maxHeight = max(maxHeight,colliders[j].y+colliders[j].rad);
                        break;
                    case "box":
                        maxHeight = max(maxHeight,colliders[j].y+colliders[j].h);
                        break;
                }
            }
            if(maxHeight<0){
                if(solids[i].y!==undefined){
                    maxHeight = max(maxHeight,solids[i].y+15);
                }
                if(solids[i].baseY!==undefined){
                    maxHeight = max(maxHeight,solids[i].baseY+20);
                }
            }
            // if(solids[i].y!==undefined){
            //     maxHeight = max(maxHeight,solids[i].y+1);
            // }
            if(maxHeight+2<this.voidHeight||(dist(solids[i].x,solids[i].z,player.x,player.z)>20&&maxHeight+1<this.voidHeight)){
                solids.splice(i,1);
                i--;
            }
        }
        for(var i = 0; i<items.length; i++){
            if(items[i].y===undefined){
                console.log("error: there's no .y value for this item");
            }
            else{
                if(items[i].y+3.6<this.voidHeight){
                    items.splice(i,1);
                    i--;
                    continue;
                }
            }
            if(items[i].testPickUp()){
                items.splice(i,1);
                i--;
            }
        }
        for(var i = 0; i<oiers.length; i++){
            oiers[i].exist();
            if(oiers[i].testDeath()){oiers.splice(i,1);i--;}
        }
        
        /*colliders.push({idTag:-1,
            x:0,y:0,z:0,
            planeNorm:{x:0,y:1,z:0},
            type:"slp",
            giveJumpFunc:giveJump,
        }); // floor collider*/
        
        playerAndCameraManagement();
        if(player.boostCooldown>0){
            player.boostCooldown--;
            if(player.boostCooldown>10){
                player.yv = 0.35;
            }
        }
        else if(inp[16]&&player.inv.boosts>0){
            player.boostCooldown = 35;
            player.inv.boosts--;
            player.xv*=1.1;
            player.zv*=1.1;
            playNote(23,0,random(0.5,0.6),0,100,0.4);
        }
        var darkness = map(constrain(this.time,1600,3000),1600,3000,0,1);
        createLightVector({x:0.1,y:-1+darkness*0.8,z:0.2},1-darkness*0.8,0.1);
        
        if(!inp[66]){
            c.makeCustomPlane({x:0,y:this.voidHeight-0.001,z:0},{x:0,y:1,z:0});
            {
                var surfaceHeight = this.voidHeight;
                var widt = 12;
                var spacing = 9;
                var lightable = false;
                var generalCol = [75-75*darkness,190-180*darkness,250-180*darkness];
                for(var i = -spacing*widt-anyModulo(c.z,spacing); i<spacing*widt+1-anyModulo(c.z,spacing); i+=spacing){
                    var len = widt*spacing/2*sin(acos(i/widt/spacing*2));
                    var lineWidth = 0.8+0.3*sin(i*3+ganime*2);
                    var qua = {
                        v1:{x:c.x-len,y:surfaceHeight,z:c.z+i-lineWidth},
                        v2:{x:c.x-len,y:surfaceHeight,z:c.z+i+lineWidth},
                        v3:{x:c.x+len,y:surfaceHeight,z:c.z+i+lineWidth},
                        v4:{x:c.x+len,y:surfaceHeight,z:c.z+i-lineWidth},
                        col:[generalCol[0],generalCol[1],generalCol[2],160+70*sin(i*6+ganime*7)]
                    };
                    adjustQuaForCamera(qua);
                    if(quaHasPositiveZVertex(qua)){
                        qua.type="qua";
                        graphics.push({
                            lightable:lightable,
                            depth:1e11,
                            primitives:[qua]
                        });
                    }
                }
                for(var i = -spacing*widt-anyModulo(c.x,spacing); i<spacing*widt+1-anyModulo(c.x,spacing); i+=spacing){
                    var len = widt*spacing/2*sin(acos(i/widt/spacing*2));
                    var lineWidth = 0.8+0.3*sin(i*2+ganime*3);
                    var qua = {
                        v1:{x:c.x+i-lineWidth,y:surfaceHeight,z:c.z-len},
                        v2:{x:c.x+i-lineWidth,y:surfaceHeight,z:c.z+len},
                        v3:{x:c.x+i+lineWidth,y:surfaceHeight,z:c.z+len},
                        v4:{x:c.x+i+lineWidth,y:surfaceHeight,z:c.z-len},
                        col:[generalCol[0],generalCol[1],generalCol[2],160+70*sin(i*6+ganime*7)]
                    };
                    adjustQuaForCamera(qua);
                    if(quaHasPositiveZVertex(qua)){
                        qua.type="qua";
                        graphics.push({
                            lightable:lightable,
                            depth:1e11,
                            primitives:[qua]
                        });
                    }
                }
            }
            drawFloor(this.voidHeight-0.000001,[70-70*darkness, 180-175*darkness, 240-185*darkness],false);
        }
        
        for(var i = 0; i<solids.length; i++){
            solids[i].draw();
        }
        for(var i = 0; i<items.length; i++){
            items[i].draw();
        }
        for(var i = 0; i<oiers.length; i++){
            oiers[i].draw();
        }
        
        if(player.pov===2){
            player.animate();
            player.draw(0);
        }
        else if(player.pov>=3){
            player.animate();
            player.draw(0.4);
        }
        
        
        
        push();
        translate(width/2,height/2);
        scale(1,-1);
        background(160-135*darkness, 225-225*darkness, 255-160*darkness);
        noStroke();
        
        displayGraphics();
        
        if(player.pov===1){
            drawCrossHair();
        }
        
        pop();
        
        for(var i = 0; i<player.inv.boosts&&i<50; i++){
            drawBoostIcon(50+i*40,height-55,20);  
        }
        noStroke();
        textSize(24);
        textAlign(LEFT,TOP);
        fill(160, 110, 0);
        text(player.inv.coins+" Coins",30,30);
        text(player.inv.coins+" Coins",31,30);
        fill(250, 210, 0);
        text(player.inv.coins+" Coins",31,29);
        
        
        if(player.y+player.yv+player.eyeLevel<=this.voidHeight+0.0001){
            // background(70, 180, 240);
            // if(player.y+player.yv+player.eyeLevel<this.voidHeight-0.1){
            player.die();
            playNote(15,1,1,0,100,1);
            // }
        }
    },
    function(){
        oiers = [];
        solids = [];
        items = [];
        mannequins = [];
        portals = [];
        stars = [];
        player.inv.boosts = 0;
        player.inv.coins = 0;
    }
),
Level.new(
    "Piano",
    function(){
        resetPlayerAndCameraTo(0,1,0, 0,0,0);
        this.popupTimer = -1;
        this.keys = [81,50,87,51,69,82,53,84,54,89,55,85,73,57,79,48,80,219,187,221,8,220];
        this.active = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        this.whiteKeys = [81,87,69,82,84,89,85,73,79,80,219,221,220];
        this.blackKeys = [50,51,-1,53,54,55,-1,57,48,-1,187,8];
        this.whiteActive = [0,0,0,0,0,0,0,0,0,0,0,0,0];
        this.blackActive = [0,0,0,0,0,0,0,0,0,0,0,0];
        this.floaters = []; // {x,y,z,w,h,timer,col}
    },
    function(){
        graphics = [];
        graphicOrders = [];
        lightSources = [];
        lightVectors = [];
        colliders = [];
        
        
        
        for(var i = 0; i<solids.length; i++){
            solids[i].makeCollider();
        }
        
        colliders.push({idTag:-1,
            x:0,y:0,z:0,
            planeNorm:{x:0,y:1,z:0},
            type:"slp",
            giveJumpFunc:giveJump,
        });
        colliders.push({idTag:-1,
            type:"box",
            x:0,y:1,z:15,
            prevx:0, prevy:1, prevz:15,
            l:1.9, h:1.1, w:1.9,
            azimuth:0,
            giveJumpFunc:giveJump
        }); // piano
        
        playerAndCameraManagement();
        
        createLightVector({x:0.1,y:-1,z:0.2},1,0.1);
        
        drawLattice(0,5,7,0.6,[70,70,80,160],false);
        drawFloor(-0.000001,[75,75,85],false);
        
        for(var i = 0; i<solids.length; i++){
            solids[i].draw();
        }
        
        drawModel(pianoModel,0,1.9,15,1.9,1.9,1.9,0,0,0,[255,255,255],true);
        for(var i = 0; i<this.whiteActive.length; i++){
            if(this.whiteActive[i]>0){
                if(drawQuad({
                    v1:{x:i*0.15-0.075-0.9,y:1.5+0.02*this.whiteActive[i],z:12.8},
                    v2:{x:i*0.15+0.075-0.9,y:1.5+0.02*this.whiteActive[i],z:12.8},
                    v3:{x:i*0.15+0.075-0.9,y:1.5,z:12.8},
                    v4:{x:i*0.15-0.075-0.9,y:1.5,z:12.8},
                    col:[0,135,275],
                },true)){graphics[graphics.length-1].depth--;}
                this.whiteActive[i]++;
            }
        }
        for(var i = 0; i<this.blackActive.length; i++){
            if(this.blackActive[i]>0){
                if(drawQuad({
                    v1:{x:i*0.15-0.05-0.9+0.075,y:1.5+0.02*this.blackActive[i],z:12.8},
                    v2:{x:i*0.15+0.05-0.9+0.075,y:1.5+0.02*this.blackActive[i],z:12.8},
                    v3:{x:i*0.15+0.05-0.9+0.075,y:1.5,z:12.8},
                    v4:{x:i*0.15-0.05-0.9+0.075,y:1.5,z:12.8},
                    col:[0,135,275],
                },true)){graphics[graphics.length-1].depth--;}
                this.blackActive[i]++;
            }
        }
        for(var i = this.floaters.length-1; i>-1; i--){
            var fi = this.floaters[i];
            fi.y+=0.02;
            fi.timer++;
            if(player.z>fi.z){
                if(drawQuad({
                    v1:{x:fi.x+fi.w,y:fi.y-fi.h,z:fi.z},
                    v2:{x:fi.x+fi.w,y:fi.y+fi.h,z:fi.z},
                    v3:{x:fi.x-fi.w,y:fi.y+fi.h,z:fi.z},
                    v4:{x:fi.x-fi.w,y:fi.y-fi.h,z:fi.z},
                    col:[fi.col[0],fi.col[1],fi.col[2],min(255,1000-5*fi.timer)],
                },true)){graphics[graphics.length-1].depth--;}
            }
            else{
                if(drawQuad({
                    v1:{x:fi.x-fi.w,y:fi.y+fi.h,z:fi.z},
                    v2:{x:fi.x+fi.w,y:fi.y+fi.h,z:fi.z},
                    v3:{x:fi.x+fi.w,y:fi.y-fi.h,z:fi.z},
                    v4:{x:fi.x-fi.w,y:fi.y-fi.h,z:fi.z},
                    col:[fi.col[0],fi.col[1],fi.col[2],min(255,1000-5*fi.timer)],
                },true)){graphics[graphics.length-1].depth--;}
            }
            if(fi.timer>=200){
                this.floaters.splice(i,1);
            }
        }
        
        if(player.pov===2){
            player.animate();
            player.draw(0);
        }
        else if(player.pov>=3){
            player.animate();
            player.draw(0.4);
        }
        
        push();
        translate(width/2,height/2);
        scale(1,-1);
        background(100,200,255);
        noStroke();
        
        displayGraphics();
        
        if(player.pov===1){
            drawCrossHair();
        }
        
            // console.log(this.floaters.length);
        pop();
        
        for(var i = 0; i<this.whiteKeys.length; i++){
            if(!inp[this.whiteKeys[i]]){
                if(this.whiteActive[i]){
                    this.floaters.push({x:i*0.15-0.9,y:1.5+0.01*(this.whiteActive[i]-1),z:12.8,w:0.075,h:0.01*this.whiteActive[i],timer:0,col:[0,0,255]});
                    this.whiteActive[i] = 0;
                }
            }
        }
        for(var i = 0; i<this.blackKeys.length; i++){
            if(!inp[this.blackKeys[i]]){
                if(this.blackActive[i]){
                    this.floaters.push({x:i*0.15-0.9+0.075,y:1.5+0.01*(this.blackActive[i]-1),z:12.8,w:0.05,h:0.01*this.blackActive[i],timer:0,col:[0,0,255]});
                    this.blackActive[i] = 0;
                }
            }
        }
        if(abs(player.x)<1.8&&abs(player.z-12.5)<1&&player.y<2){
            if(player.zv>0){
                player.zv=0;
                player.xv=0;
            }
            if(this.popupTimer===-1){
                this.popupTimer = 1080;
            }
            if(this.popupTimer>0){
                push();
                translate(width/2,height/2);
                scale(min(width/600,height/600));
                textSize(30);
                fill(0,this.popupTimer);
                textAlign(CENTER,CENTER);
                noStroke();
                text("Press qwerty and number keys",-1,0);
                text("Press qwerty and number keys",0,-1);
                fill(255,this.popupTimer);
                text("Press qwerty and number keys",1,1);
                pop();
                this.popupTimer-=3;
            }
            for(var i = 0; i<this.keys.length; i++){
                if(inp[this.keys[i]]){
                    this.active[i]++;
                    playNote(19,0,0.2106*pow(2,i/12),0.22,12,0.8-0.4*pow(this.active[i],0.13));
                    // playNote(19,0,0.2106*pow(2,i/12),0.22,12,min(0.5,0.1+0.5*pow(0.99,this.active[i])));
                }
                else{
                    this.active[i] = 0;
                }
            }
            for(var i = 0; i<this.whiteKeys.length; i++){
                if(inp[this.whiteKeys[i]]){
                    if(!this.whiteActive[i]){
                        this.whiteActive[i] = 1;
                    }
                }
            }
            for(var i = 0; i<this.blackKeys.length; i++){
                if(inp[this.blackKeys[i]]){
                    if(!this.blackActive[i]){
                        this.blackActive[i] = 1;
                    }
                }
            }
        }
    },
    function(){
        oiers = [];
        solids = [];
        items = [];
        mannequins = [];
        portals = [];
    }
),
Level.new(
    "Bagels",
    function(){
        resetPlayerAndCameraTo(0,1,0, 0,0,0);
        // for(var i = 0; i<1; i++){
        //     stars.push({x:0,y:0,z:3000});
        // }
        for(var ang = 0; ang<360; ang+=20){
            var gz = 22*sin(ang);
            var h = map(gz,-22,22,0.5,7);
            solids.push(Block.new(22*cos(ang),h,gz+10,1,h,1,ang+45,[255,190,180+75*(ang%40===0)]));
        }
    },
    function(){
        graphics = [];
        graphicOrders = [];
        lightSources = [];
        lightVectors = [];
        colliders = [];
        
        for(var i = 0; i<solids.length; i++){
            solids[i].makeCollider();
        }
        
        colliders.push({idTag:-1,
            x:0,y:0,z:0,
            planeNorm:{x:0,y:1,z:0},
            type:"slp",
            giveJumpFunc:giveJump,
        });
        
        playerAndCameraManagement();
        
        createLightVector({x:0.8,y:-1,z:-0.2},1,0.1);
        
        drawLattice(0,5,7,0.6,[205,205,185,160],false);
        drawFloor(-0.000001,[215,215,190],false);
        
        for(var i = 0; i<solids.length; i++){
            solids[i].draw();
        }
        
        for(var i = 0; i<3; i++){
            for(var j = 0; j<3; j++){
                for(var k = 0; k<3; k++){
                    drawModel(makeBagelModel((0.46-0.17*k),4+4*j,4+4*i),5*j-5,3+5*k,11+5*i,2.2,2.2,2.2,0,0,ganime,[255,175,55],true);
                }
            }
        }
        // for(var i = 0; i<stars.length; i++){
        //     drawStar(pCopy(stars[i]));
        // }
        
        if(player.pov===2){
            player.animate();
            player.draw(0);
        }
        else if(player.pov>=3){
            player.animate();
            player.draw(0.4);
        }
        
        push();
        translate(width/2,height/2);
        scale(1,-1);
        background(100,200,255);
        noStroke();
        
        displayGraphics();
        
        if(player.pov===1){
            drawCrossHair();
        }
        
        pop();
    },
    function(){
        oiers = [];
        solids = [];
        items = [];
        mannequins = [];
        portals = [];
    }
),
Level.new(
    "Zombies",
    function(){
        resetPlayerAndCameraTo(-6,0,12, 220,0,0);
        
        player.holding = "small gun";
        solids.push(MediumTree.new(0,0,10,2,0,90,25,2.5,71,[45,45,45],[245,55,55],25));
        for(var i = 0; i<10; i++){
            var next = makeMannequinClone(mannequinTemplates.zombie);
            next.x=random(-20,20);
            next.z=random(-50,-10);
            mannequins.push(next);
        }
        for(var i = 0; i<8; i++){
            solids.push(Block.new(0,0.5+i,-2-7*i,1,0.5+i,1,0,[50+30*i,50,50,255]));
        }
        for(var i = 0; i<mannequins.length; i++){
            mannequins[i].onStart();
        }
    },
    function(){
        graphics = []; graphicOrders = []; lightSources = []; lightVectors = []; colliders = [];
        
        for(var i = 0; i<solids.length; i++){
            solids[i].makeCollider();
        }
        for(var i = 0; i<mannequins.length; i++){
            mannequins[i].makeCollider();
        }
        colliders.push({idTag:-1,x:0,y:0,z:0,planeNorm:{x:0,y:1,z:0},type:"slp",giveJumpFunc:giveJump,});// floor
        
        playerAndCameraManagement();
        
        createLightVector({x:0.1,y:-1,z:0.2},1,0.1);
        drawLattice(0,5,7,0.6,[70,70,80,160],false);
        drawFloor(-0.000001,[75,75,85],false);
        
        for(var i = 0; i<solids.length; i++){
            solids[i].draw();
        }
        for(var i = 0; i<mannequins.length; i++){
            mannequins[i].exist();
            if(mannequins[i].testDeath()){mannequins.splice(i,1);i--;}
        }
        for(var i = 0; i<oiers.length; i++){
            oiers[i].exist();
            if(oiers[i].testDeath()){oiers.splice(i,1);i--;}
        }
        
        
        
        
        if(player.pov===1){
            player.animate();
            player.draw(0,0.4);
        }
        else if(player.pov===2){
            player.animate();
            player.draw(0);
        }
        else if(player.pov>=3){
            player.animate();
            player.draw(0.4);
        }
        
        push(); translate(width/2,height/2); scale(1,-1); noStroke();
        background(100,200,255);
        displayGraphics();
        if(player.pov===1){drawCrossHair();}
        pop();
    },
    function(){
        oiers = [];
        solids = [];
        items = [];
        mannequins = [];
        portals = [];
        for(var i = 0; i<mannequins.length; i++){
            mannequins[i].onEnd();
        }
        player.holding = "nothing";
    }
),
Level.new(
    "T3D",
    function(){
        this.popupTimer = 1000;
        this.screenModelSize = 1.4;
        this.screenModelZ = 3.2;
        this.t3dVertices = [];
        resetPlayerAndCameraTo(-4.1,0,0.4, 305,-11,0);
        
        solids.push(Block.new(1.5,-1.5*this.screenModelSize+1.6,14,1.4,1.6,1.8,55,[100,0,240]));
        solids.push(Pole.new(-1.5,-1.5*this.screenModelSize+0.8,10.5,1.3,0.8,10,[240,100,0]));
        
        this.npcs = [];
        this.npcs.push(Mannequin.new(0,-1.5*this.screenModelSize,0,0.7,0,0,0,[[160,160,160],[235,235,190],[160,160,160],[160,160,160],[230,230,230],[230,230,230]],100,function(){},function(){
            var ted = this;
            ted.bodyFrame = argsGenerateBodyFrame(
                ted.x,ted.y+ted.eyeLevel+0.12,ted.z,
                [ted.bodyScale*0.45,ted.bodyScale*1,ted.bodyScale*1.3,ted.bodyScale*1.5,ted.bodyScale*0.45,ted.bodyScale*1.5],
                bodyFrameUArgsGenerators.clap(ganime%120/120,ted.azimuth),
                bodyFrameLArgsGenerators.stand(0)
            );
        },function(){}));
    },
    function(){
        graphics = []; graphicOrders = []; lightSources = []; lightVectors = []; colliders = [];
        for(var i = 0; i<solids.length; i++){
            solids[i].makeCollider();
            solids[i].prevx = solids[i].x;
            solids[i].prevy = solids[i].y;
            solids[i].prevz = solids[i].z;
        }
        for(var i = 0; i<this.npcs.length; i++){
            this.npcs[i].makeCollider();
        }
        colliders.push({idTag:-1,x:0,y:-1.5*this.screenModelSize,z:0,planeNorm:{x:0,y:1,z:0},type:"slp",giveJumpFunc:giveJump,});// floor
        
        playerAndCameraManagement();
        // if(inp[69]){c.y=-1.5*this.screenModelSize; console.log(c.y);}
        
        createLightVector({x:0.4,y:-1,z:0.2},1.15,0.15);
        //drawFloor(-1e9,[0,0,0],true);
        drawLattice(-1.5*this.screenModelSize,5,7,0.6,[50,150,30,100],false);
        drawFloor(-1.5*this.screenModelSize-0.000001,[60,160,40],false);
        
        for(var i = 0; i<solids.length; i++){
            solids[i].draw();
        }
        for(var i = 0; i<this.npcs.length; i++){
            this.npcs[i].exist();
            if(this.npcs[i].testDeath()){this.npcs.splice(i,1);i--;}
        }
        
        drawModel(screenModel,0,0,this.screenModelZ,this.screenModelSize,this.screenModelSize,this.screenModelSize,0,0,0,[120,120,120],true);
        drawDot({x:0,y:0,z:0,rad:0.14,renderType:"circle",col:[255,255,255]});
        drawDot({x:0,y:0,z:0,rad:0.08,renderType:"circle",col:[0,0,0]});
        
        // =D hardcoded block and pole :skul: 
        this.t3dVertices = [];
        for(var j = 0; j<solids.length; j++){
            var complexAzimuth = angToComplex(solids[j].azimuth);
            var m;
            if(j){m = octoCylinderModel;}
            else{m = cubeModel;}
            for(var i = 0; i<m.coordData.length; i++){
                // set and scale
                var pcoord={
                    x:m.coordData[i].x*(solids[j].l||solids[j].rad),
                    y:m.coordData[i].y*solids[j].h,
                    z:m.coordData[i].z*(solids[j].w||solids[j].rad),
                };
                // complexRotateTwist(pcoord,complexTwist);
                // complexRotateElevation(pcoord,complexElevation);
                complexRotateAzimuth(pcoord,complexAzimuth);
                pcoord.x+=solids[j].x;
                pcoord.y+=solids[j].y;
                pcoord.z+=solids[j].z;
                this.t3dVertices.push(pcoord);
            }
        }
        var icoords = [];
        for(var i = 0; i<this.t3dVertices.length; i++){
            icoords.push(vScale(this.t3dVertices[i],this.screenModelZ/this.t3dVertices[i].z));
        }
        for(var i = 0; i<this.t3dVertices.length; i++){
            var pcoord = this.t3dVertices[i];
            
            if(inp[84]){
                drawDot({x:pcoord.x,y:pcoord.y,z:pcoord.z,rad:0.1,renderType:"circle",col:[255,255,255]},false);
            }
            if(inp[89]){
                if(drawDot({x:pcoord.x,y:pcoord.y,z:pcoord.z,rad:0.1,renderType:"circle",col:[255,255,255]},false)){
                    graphics[graphics.length-1].depth = 0;
                }
            }
            if(inp[85]){
                if(drawLine({v1:pCopy(pcoord),v2:pCopy(origin),rad:0.03,col:[200,200,200]},false)){
                    graphics[graphics.length-1].depth = 0;
                }
            }
            if(inp[73]){
                if(drawLine({v1:pCopy(pcoord),v2:pCopy(icoords[i]),rad:0.03,col:[200,200,200]},false)){
                    graphics[graphics.length-1].depth = 0;
                }
                drawDot({x:icoords[i].x,y:icoords[i].y,z:icoords[i].z,rad:0.05,renderType:"circle",col:[255,255,255]},false);
            }
        }
        if(inp[79]){
            {
                var s = 0;
                var m = cubeModel;
                var graphicGroup = {
                    lightable:false,
                    depth:-1,
                    primitives:[],
                };
                for(var i = 0; i<m.quaData.length; i++){
                    var qua = {
                        v1:pCopy(icoords[s+m.quaData[i].v1]),
                        v2:pCopy(icoords[s+m.quaData[i].v2]),
                        v3:pCopy(icoords[s+m.quaData[i].v3]),
                        v4:pCopy(icoords[s+m.quaData[i].v4]),
                        col:[255,255,255,180],
                        type:"qua"
                        // no shading
                    };
                    
                    var isVisible = false;
                    if(vDotProduct(threePointNormal(qua),quaCenter(qua))<0){isVisible=true;}
                    if(isVisible){
                        drawQuad(qua);
                    
                    
                    
                        // if(quaHasPositiveZVertex(qua)){
                        //     graphicGroup.primitives.push(qua);
                        //     var d = distOriginToQua(qua);
                        //     if(graphicGroup.depth===-1||d<graphicGroup.depth){
                        //         graphicGroup.depth=d;
                        //     }
                        // }
                    }
                }
            }
            {
                var s = 8;
                var m = octoCylinderModel;
                var graphicGroup = {
                    lightable:false,
                    depth:-1,
                    primitives:[],
                };
                for(var i = 0; i<m.quaData.length; i++){
                    var qua = {
                        v1:pCopy(icoords[s+m.quaData[i].v1]),
                        v2:pCopy(icoords[s+m.quaData[i].v2]),
                        v3:pCopy(icoords[s+m.quaData[i].v3]),
                        v4:pCopy(icoords[s+m.quaData[i].v4]),
                        col:[255,255,255,180],
                        type:"qua"
                        // no shading
                    };
                    
                    var isVisible = false;
                    if(vDotProduct(threePointNormal(qua),quaCenter(qua))<0){isVisible=true;}
                    if(isVisible){
                        drawQuad(qua);
                    
                    
                    
                        // if(quaHasPositiveZVertex(qua)){
                        //     graphicGroup.primitives.push(qua);
                        //     var d = distOriginToQua(qua);
                        //     if(graphicGroup.depth===-1||d<graphicGroup.depth){
                        //         graphicGroup.depth=d;
                        //     }
                        // }
                    }
                }
            }
        }
        if(inp[80]){
            solids[0].azimuth+=5;
            solids[1].y += 0.2*sin(solids[0].azimuth-55);
        }
        
        if(player.pov===2){
            player.animate();
            player.draw(0);
        }
        else if(player.pov>=3){
            player.animate();
            player.draw(0.4);
        }
        
        push(); translate(width/2,height/2); scale(1,-1); noStroke();
        background(0, 205, 255);
        displayGraphics();
        if(player.pov===1){drawCrossHair();}
        pop();
        
        if(this.popupTimer>0){
            push();
            translate(width/2,height/2);
            scale(min(width/600,height/600));
            textSize(30);
            fill(0,this.popupTimer);
            textAlign(CENTER,CENTER);
            noStroke();
            text("Press y,u,i,o,p keys",-1,0);
            text("Press y,u,i,o,p keys",0,-1);
            fill(255,this.popupTimer);
            text("Press y,u,i,o,p keys",1,1);
            pop();
            this.popupTimer-=3;
        }
    
        for(var i = 0; i<portals.length; i++){
            portals[i].operate();
        }
    },
    function(){
        oiers = [];
        solids = [];
        items = [];
        mannequins = [];
        portals = [];
    }
),
Level.new(
    "Parcore",
    function(){
        resetPlayerAndCameraTo(0,0.2,0, 310,0,0);
        stars = [];
        for(var i = 0; i<140; i++){
            stars.push({x:0,y:0,z:random(10000,45000)});
            angRotatePointTEA(stars[i],origin,random(0,360),random(0,oneOf(-0.95,0.95)*acos(random(0,0.99999))),0);
        }
        
        this.maxPlatformDistance = 80;
        this.windowNext = 0;
        this.hue = 2/6;
        this.lanterns = [];
        this.incrementHue = function(){
            this.hue = anyModulo(this.hue+0.02,1);
            return this.hue;
        };
        this.generateParcore = function(x,y,z){ // 22,0,7
            var lightness = 0;
            
            if(x===0&&y===0&&z===0){
                solids.push(Block.new(0,0.1,0,4.5,0.1,2,20,[230,230,230]));
            }
            else{
                solids.push(Block.new(x,y+0.1,z,4.5,0.1,0.2,45,hueLightnessToRGB(this.incrementHue(),lightness)));
            }
            solids.push(Block.new(x+8,y+1,z+4,1,1,1,70,hueLightnessToRGB(this.incrementHue(),lightness)));
            solids.push(Block.new(x+8,y+2,z+9,0.1,2,0.4,85,hueLightnessToRGB(this.incrementHue(),lightness)));
            solids.push(Block.new(x,y+3,z+10,2,3,3,40,hueLightnessToRGB(this.incrementHue(),lightness)));
            solids.push(Block.new(x+2,y+7.5,z+18.5,1.2,0.3,0.4,45,hueLightnessToRGB(this.incrementHue(),lightness)));
            solids.push(Block.new(x+2,y+3.6,z+18.5,0.3,3.6,0.3,0,hueLightnessToRGB(this.hue,lightness)));
            solids.push(Block.new(x+10.3,y+9.2,z+19.8,1,0.5,1,5,hueLightnessToRGB(this.incrementHue(),lightness)));
            
            for(var i = 0; i<1; i++){
                var lx,ly,lz;
                var works = false;
                while(works===false){
                    lx = x+random(-7,17);
                    lz = z+random(-1,23);
                    ly = lx*5/22+lz*5/20+random(-1.5,0);
                    works = true;
                    for(var i = 0; i<solids.length; i++){
                        if(solids[i].contains({x:lx,y:ly,z:lz},1,1)){
                            works = false;
                        }
                    }
                }
                this.lanterns.push({x:lx,y:ly,z:lz});
            }
        };
        
        // for(var i = this.windowFirst; i<=this.windowLast; i++){
        //     this.generateParcore(22*i,10*i,20*i);
        // }
    },
    function(){
        graphics = []; graphicOrders = []; lightSources = []; lightVectors = []; colliders = [];
        
        var playerProgress = (player.x/22+player.z/20)/2;
        while(playerProgress > this.windowNext-4){
            this.generateParcore(this.windowNext*22,this.windowNext*10,this.windowNext*20);
            this.windowNext++;
        }
        if(solids.length>0&&dist(solids[0].x,solids[0].z,player.x,player.z)>this.maxPlatformDistance+5){
            solids.splice(0,1);
        }
        for(var i = this.lanterns.length-1; i>=0; i--){
            if(dist(this.lanterns[i].x,this.lanterns[i].z,player.x,player.z)>this.maxPlatformDistance+5&&this.lanterns[i].x+this.lanterns[i].z<player.x+player.z){
                this.lanterns.splice(i,1);
            }
        }
        
        for(var i = 0; i<solids.length; i++){
            solids[i].makeCollider();
        }
        
        playerAndCameraManagement();
        
        createLightVector({x:0,y:-1,z:0.3},0.35,0.05);
        for(var i = 0; i<this.lanterns.length; i++){
            createLightSource(this.lanterns[i].x,this.lanterns[i].y,this.lanterns[i].z,1,9,2,0);
            drawModel(octahedronModel,this.lanterns[i].x,this.lanterns[i].y,this.lanterns[i].z,0.3,0.3,0.3,ganime,0,0,[255,255,255,constrain(map(dist(this.lanterns[i].x,this.lanterns[i].z,player.x,player.z),0,this.maxPlatformDistance,400,0),0,255)],false);
        }
        //drawFloor(-1e9,[0,0,0],true);
        for(var i = 0; i<solids.length; i++){
            solids[i].col[3] = constrain(map(dist(solids[i].x,solids[i].z,player.x,player.z),0,this.maxPlatformDistance,275,0),0,255);
            if(solids[i].col[3]>0){
                solids[i].draw();
            }
        }
        for(var i = 0; i<portals.length; i++){
            portals[i].draw();
        }
        for(var i = 0; i<stars.length; i++){
            drawStar(pCopy(stars[i]),1);
        }
        
        if(player.pov===2){
            player.animate();
            player.draw(0);
        }
        else if(player.pov>=3){
            player.animate();
            player.draw(0.4);
        }
        
        push(); translate(width/2,height/2); scale(1,-1); noStroke();
        background(20,0,60);
        displayGraphics();
        if(player.pov===1){drawCrossHair();}
        pop();
        
        if(player.y+player.eyeLevel*0.7<=-6+5/22*player.x+5/20*player.z){
            player.die();
            player.elevation=-30;
        }
        else{
            for(var i = 0; i<portals.length; i++){
                portals[i].operate();
            }
        }
    },
    function(){
        oiers = [];
        solids = [];
        items = [];
        mannequins = [];
        stars = [];
        portals = [];
    }
),
Level.new(
    "Microwave",
    function(){
        resetPlayerAndCameraTo(1,0,-4, -20,0,0);
        this.time = 0;
        
        for(var i = 3; i===3; i++){
            solids.push(MediumTree.new(5+sin(i*120-200)*4,0,pow(i+0.5,1.6)*3.2-2,1.2+i*0.7,i*50+130*(i===5),90,max(6+7*i,27),1.8+i/2,1+i,[160,100,20],[20,140,35],25));
        }
        
        // portals.push(Portal.new(9,19,54,0,function(){
        //     switchToLevel(findLevel("Trees Don't Die"));
        // },[0,255,0]));
    },
    function(){
        graphics = []; graphicOrders = []; lightSources = []; lightVectors = []; colliders = [];
        
        for(var i = 0; i<solids.length; i++){
            solids[i].makeCollider();
        }
        colliders.push({idTag:-1,x:0,y:0,z:0,planeNorm:{x:0,y:1,z:0},type:"slp",giveJumpFunc:giveJump,});// floor
        
        playerAndCameraManagement();
        
        this.time+=0.65;
        var sunElevation = 6.5;
        createLightVector({x:cos(this.time),y:-tan(sunElevation),z:sin(this.time)},1.15,0.15);
        drawSun(1e7,1e6,20,this.time+90,sunElevation,ganime*7,[255,255,255],false);
        //drawFloor(-1e9,[0,0,0],true);
        drawLattice(0,5,7,0.6,[50,150,30,100],false);
        drawFloor(-0.000001,[60,160,40],false);
        for(var i = 0; i<solids.length; i++){
            solids[i].draw();
        }
        for(var i = 0; i<portals.length; i++){
            portals[i].draw();
        }
        
        if(player.pov===2){
            player.animate();
            player.draw(0);
        }
        else if(player.pov>=3){
            player.animate();
            player.draw(0.4);
        }
        
        push(); translate(width/2,height/2); scale(1,-1); noStroke();
        background(0, 205, 255);
        displayGraphics();
        if(player.pov===1){drawCrossHair();}
        pop();
    
        for(var i = 0; i<portals.length; i++){
            portals[i].operate();
        }
    },
    function(){
        oiers = [];
        solids = [];
        items = [];
        mannequins = [];
        portals = [];
    }
),
Level.new(
    "Infinite Maze",
    function(){
        resetPlayerAndCameraTo(0,1,0, 0,0,0);
        this.tileSize = 4;
        this.chunkSize = 6;
        this.loadingRad = 60;
        this.h = 4.5;
        this.maze = InfiniteMaze.new(0,0,0,0.02,this.h,connectionByGrowthInHilbert,this.tileSize,this.chunkSize,this.loadingRad); //x,y,z,h,connectionFunc,tileSize,chunkSize,loadingRad
        solids.push(this.maze);
    
        player.inv.boosts = 0;
        player.inv.coins = 0;
        player.boostCooldown = 10;

        this.dest = {
            x:null,
            y:null,
        };
        this.pathToDest = [];
        this.calculatePathToDest = function(startX,startY,itersLimit){
            if(itersLimit===undefined){
                itersLimit = 100;
            }
            let bot1 = {x:startX,y:startY};
            let bot2 = {x:this.dest.x,y:this.dest.y};
            let seen = new Set();
            let lca = null;
            for(let iters = 0; iters<itersLimit; iters++){
                if(seen.has(bot1.x+","+bot1.y)){
                    lca = {x:bot1.x,y:bot1.y};
                    break;
                }
                seen.add(bot1.x+","+bot1.y);
                if(seen.has(bot2.x+","+bot2.y)){
                    lca = {x:bot2.x,y:bot2.y};
                    break;
                }
                seen.add(bot2.x+","+bot2.y);
                let d1 = this.maze.connectionFunc(bot1.x,bot1.y,this.maze.chunkSize);
                let d2 = this.maze.connectionFunc(bot2.x,bot2.y,this.maze.chunkSize);
                bot1.x+=dirx[d1];
                bot1.y+=diry[d1];
                bot2.x+=dirx[d2];
                bot2.y+=diry[d2];
            }
            if(lca===null){
                return false;
            }
            this.pathToDest = [];
            bot1 = {x:startX,y:startY};
            bot2 = {x:this.dest.x,y:this.dest.y};
            for(let iters = 0; iters<itersLimit; iters++){
                this.pathToDest.push({x:bot1.x,y:bot1.y});
                if(bot1.x===lca.x&&bot1.y===lca.y){
                    break;
                }
                let d1 = this.maze.connectionFunc(bot1.x,bot1.y,this.maze.chunkSize);
                bot1.x+=dirx[d1];
                bot1.y+=diry[d1];
            }
            let stack = [];
            for(let iters = 0; iters<itersLimit; iters++){
                if(bot2.x===lca.x&&bot2.y===lca.y){
                    break;
                }
                stack.push({x:bot2.x,y:bot2.y});
                let d2 = this.maze.connectionFunc(bot2.x,bot2.y,this.maze.chunkSize);
                bot2.x+=dirx[d2];
                bot2.y+=diry[d2];
            }
            for(let i = stack.length-1; i>=0; i--){
                this.pathToDest.push({x:stack[i].x,y:stack[i].y});
            }
            return true;
        }
    },
    function(){
        graphics = []; graphicOrders = []; lightSources = []; lightVectors = []; colliders = [];
        
        if(inp[49]||inp[50]||inp[51]||inp[52]||inp[53]){
            items = [];
            if(inp[49]){
                this.tileSize = 4;
                this.chunkSize = 6;
                this.loadingRad = 60;
                this.h = 1;
                inp[49] = false;
            }
            if(inp[50]){
                this.tileSize = 40;
                this.chunkSize = 6;
                this.loadingRad = 600;
                this.h = 2.5;
                inp[50] = false;
            }
            if(inp[51]){
                this.tileSize = 1.2;
                this.chunkSize = 6;
                this.loadingRad = 18;
                this.h = 4;
                inp[51] = false;
            }
            if(inp[52]){
                this.tileSize = 4;
                this.chunkSize = 1;
                this.loadingRad = 60;
                this.h = 2;
                inp[52] = false;
            }
            if(inp[53]){
                this.tileSize = 4;
                this.chunkSize = 1000;
                this.loadingRad = 60;
                this.h = 2;
                inp[53] = false;
            }
            this.maze = (InfiniteMaze.new(0,0,0,0.02,this.h,connectionByGrowthInHilbert,this.tileSize,this.chunkSize,this.loadingRad));//x,y,z,h,connectionFunc,tileSize,chunkSize,loadingRad
            solids[0] = this.maze;
        }
        if(mouse.status==="clicking"){
            if(player.elevation<-0.1){
                let dst = (player.y+player.eyeLevel)*tan(90+player.elevation);
                let x = player.x+dst*-sin(player.azimuth);
                let z = player.z+dst*cos(player.azimuth);
                this.dest = {x:round(x/this.tileSize),y:round(-z/this.tileSize)};
                this.calculatePathToDest(round(player.x/this.tileSize),round(-player.z/this.tileSize),200);
            }
        }

        this.maze.generateLoot();
        for(var i = 0; i<solids.length; i++){
            solids[i].makeCollider();
        }
        colliders.push({idTag:-1,x:0,y:0,z:0,planeNorm:{x:0,y:1,z:0},type:"slp",giveJumpFunc:giveJump,});// floor
        for(var i = 0; i<items.length; i++){
            if(dist(items[i].x,items[i].z,player.x,player.z)>this.loadingRad+40){
                items.splice(i,1);
                i--;
                continue;
            }
            if(items[i].testPickUp()){
                items.splice(i,1);
                i--;
            }
        }

        playerAndCameraManagement();
        if(player.boostCooldown>0){
            player.boostCooldown--;
            if(player.boostCooldown>10){
                player.yv = 0.35;
            }
        }
        else if(inp[16]&&player.inv.boosts>0){
            player.boostCooldown = 35;
            player.inv.boosts--;
            player.xv*=1.1;
            player.zv*=1.1;
            playNote(23,0,random(0.5,0.6),0,100,0.4);
        }
                
        createLightVector({x:6,y:-5,z:3},1,0.1);

        drawLattice(0,6.5,this.tileSize/ceil(this.tileSize/9),0.6,[30,110,10,125],false);
        drawFloor(-0.000001,[45,120,30],false);
        for(var i = 0; i<solids.length; i++){
            solids[i].draw();
        }
        for(var i = 0; i<items.length; i++){
            items[i].draw();
        }
        for(var i = 0; i<portals.length; i++){
            portals[i].draw();
        }
        for(var i = 0; i<=this.pathToDest.length-1; i+=0.5){
            let x,z,progress;
            if(i===round(i)){
                if(i-1>=0&&i+1<this.pathToDest.length){
                    if((this.pathToDest[i+1].x!==this.pathToDest[i].x||this.pathToDest[i-1].x!==this.pathToDest[i].x)&&(this.pathToDest[i+1].y!==this.pathToDest[i].y||this.pathToDest[i-1].y!==this.pathToDest[i].y)){
                        continue;
                    }
                }
                x = (this.pathToDest[i].x)*this.tileSize;
                z = (-this.pathToDest[i].y)*this.tileSize;
            }
            else{
                x = (this.pathToDest[floor(i)].x+this.pathToDest[ceil(i)].x)/2*this.tileSize;
                z = (-this.pathToDest[floor(i)].y-this.pathToDest[ceil(i)].y)/2*this.tileSize;
            }
            progress = (i+1)/(this.pathToDest.length);
            drawDot({
                x:x,
                y:1.5,
                z:z,
                rad:0.6,
                renderType:"circle",
                renderRotation:0,
                col:[min(255,510-510*progress),min(255,510*progress),0,150]
            });
            // if(drawDot({
            //     x:x,
            //     y:1.4,
            //     z:z,
            //     rad:0.6,
            //     renderType:"circle",
            //     renderRotation:0,
            //     col:[min(255,510-510*progress),min(255,510*progress),0,15]
            // })){
            //     graphics[graphics.length-1].depth = 0;
            // }
        }
        
        if(player.pov===2){
            player.animate();
            player.draw(0);
        }
        else if(player.pov>=3){
            player.animate();
            player.draw(0.4);
        }
        
        push(); translate(width/2,height/2); scale(1,-1); noStroke();
        background(0, 205, 255);
        displayGraphics();
        if(player.pov===1){drawCrossHair();}
        pop();

        
        for(var i = 0; i<player.inv.boosts&&i<50; i++){
            drawBoostIcon(50+i*40,height-55,20);  
        }
        noStroke();
        textSize(24);
        textAlign(LEFT,TOP);
        fill(160, 110, 0);
        text(player.inv.coins+" Coins",30,30);
        text(player.inv.coins+" Coins",31,30);
        fill(250, 210, 0);
        text(player.inv.coins+" Coins",31,29);
        
    
        for(var i = 0; i<portals.length; i++){
            portals[i].operate();
        }
    },
    function(){
        oiers = [];
        solids = [];
        items = [];
        mannequins = [];
        portals = [];
    }
),
Level.new(
    "Boids",
    function(){
        this.popupTimer = 1000;
        // resetPlayerAndCameraTo(0,1,0, 0,0,0);
        this.constant = 0.8;
        this.markFriends = false;
        this.aff = 0.92;
        this.doBounds = true;
        this.detection = 11;

        this.boids = [];
        this.spawnCluster = function(x,y,z,count){
            for(var i = 0; i<count; i++){
                var r = 1;
                this.boids.push(Boid.new(x+random(-r,r),y+random(-r,r),z+random(-r,r),0,0));
            }
        }
        for(var i = 0; i<20; i++){
            var r = 60;
            this.spawnCluster(random(-r,r),random(0,r),random(-r,r),6);
        }
    },
    function(){
        graphics = []; graphicOrders = []; lightSources = []; lightVectors = []; colliders = [];
        
        for(var i = 0; i<solids.length; i++){
            solids[i].makeCollider();
        }
        colliders.push({idTag:-1,x:0,y:0,z:0,planeNorm:{x:0,y:1,z:0},type:"slp",giveJumpFunc:giveJump,});// floor
        
        playerAndCameraManagement();
        
        createLightVector({x:0.1,y:-1,z:-0.3},1.15,0.15);
        //drawFloor(-1e9,[0,0,0],true);
        drawLattice(0,9,7,0.6,[210,210,235,80],false);
        drawFloor(-0.000001,[190,190,215],false);
        
        for(var i = 0; i<solids.length; i++){
            solids[i].draw();
        }
        var iterCount = 4;
        if(this.aff>0.95){
            iterCount = 2;
        }
        for(var iters = 0; iters<iterCount; iters++){
            for(var i = 0; i<this.boids.length; i++){
                this.boids[i].exist(this.boids,this.doBounds,this.detection,this.constant);
            }
        }
        for(var i = 0; i<this.boids.length; i++){
            this.boids[i].draw();
            if(this.markFriends){
                this.boids[i].markFriends(this.boids,i,5,8);
            }
        }
        
        if(player.pov===2){
            player.animate();
            player.draw(0);
        }
        else if(player.pov>=3){
            player.animate();
            player.draw(0.4);
        }
        
        push(); translate(width/2,height/2); scale(1,-1); noStroke();
        background(255, 235, 255);
        displayGraphics();
        if(player.pov===1){drawCrossHair();}
        pop();
        
        for(var i = 0; i<portals.length; i++){
            portals[i].operate();
        }

        if(inp[89]){
            inp[89] = false;
            this.constant+=0.12;
            if(this.constant>1){
                this.constant = 0.8;
            }
        }
        if(inp[85]){
            inp[85] = false;
            this.markFriends = !this.markFriends;
        }
        if(inp[73]){
            inp[73] = false;
            this.aff+=0.075;
            if(this.aff>1){
                this.aff = 0.92;
            }
            for(var i = 0; i<this.boids.length; i++){
                this.boids[i].airFrictionFactor = this.aff;
            }
        }
        if(inp[79]){
            inp[79] = false;
            this.doBounds = !this.doBounds;
        }
        if(inp[80]){
            inp[80] = false;
            this.detection+=3;
            if(this.detection>14){
                this.detection = 11;
            }
        }
        
        if(this.popupTimer>0){
            push();
            translate(width/2,height/2);
            scale(min(width/600,height/600));
            textSize(30);
            fill(0,this.popupTimer);
            textAlign(CENTER,CENTER);
            noStroke();
            text("Press y,u,i,o,p keys",-1,0);
            text("Press y,u,i,o,p keys",0,-1);
            fill(255,this.popupTimer);
            text("Press y,u,i,o,p keys",1,1);
            pop();
            this.popupTimer-=3;
        }
    },
    function(){
        oiers = [];
        solids = [];
        items = [];
        mannequins = [];
        portals = [];
    }
),
Level.new(
    "Hot Air Balloon",
    function(){
        resetPlayerAndCameraTo(0,12.5,-60, 0,10,0);

        this.given = false; // boost gift
        this.cancelJump = 0;
        this.hab = {x:0,y:40.4,z:140};
        this.habSeat = Pole.new(this.hab.x,this.hab.y-33.3,this.hab.z,5,3.6,0,[220,180,115,255]);
        this.habBarrier = Pole.new(this.hab.x,this.hab.y-25,this.hab.z,2.3,4.5,0,[0,0,0,200]);
        this.habAzimuth = 165;
        // this.habBarrier2 = Pole.new(this.hab.x,this.hab.y-25,this.hab.z,5.3,2.2,0,[0,0,0,200]);
        
        // solids.push(Block.new(22,0.1,7,4.5,0.1,2,20,[0,0,55,255]));
    },
    function(){
        graphics = [];
        graphicOrders = [];
        lightSources = [];
        lightVectors = [];
        colliders = [];

        if(inp[32]&&dist(player.x,player.z,this.hab.x,this.hab.z)<5.55&&player.y>this.habSeat.y){
            this.habSeat.y = max(this.habSeat.y,player.y+player.yv-this.habSeat.h);
            this.hab.y = this.habSeat.y+33.3;
            this.habBarrier.y = this.hab.y-25;
            this.cancelJump = 2;
            this.habAzimuth++;
        }
        
        if(player.z>this.hab.z-50&&(player.z>this.hab.z+10||!this.given)){
            if(player.inv.boosts===0){
                player.inv.boosts++;
                this.given = true;
            }
        }

        for(var i = 0; i<solids.length; i++){
            solids[i].makeCollider();
        }
        this.habSeat.makeCollider();
        this.habBarrier.makeCollider();
        this.habSeat.prevy = this.habSeat.y;
        this.habBarrier.prevy = this.habBarrier.y;
        // this.habBarrier2.makeCollider();
        
        // colliders.push({idTag:-1,
        //     x:0,y:0,z:0,
        //     planeNorm:{x:0,y:1,z:1},
        //     type:"slp",
        //     giveJumpFunc:giveJump,
        // }); // slope collider
        colliders.push({idTag:-1,
            x:0,y:0,z:0,
            planeNorm:{x:0,y:1,z:0},
            type:"slp",
            giveJumpFunc:giveJump,
        }); // floor collider
        colliders.push({idTag:-1,
            x:0,y:0,z:0,
            planeNorm:{x:0,y:5,z:1},
            type:"slp",
            giveJumpFunc:giveJump,
        }); // slope collider
        
        

        player.drift();
        player.makeCollider();
        player.canJump--;
        if(player.canJump<0.0001){player.canJump=0;}
        player.interactWithColliders(false,true);
        
        if(inp[220]){player.canJump=1;}
        player.operate();
        player.gravity(0.015);

        

        if(this.cancelJump>0){
            if(!inp[32]){
                player.yv = min(player.yv,0);
                if(dist(player.x,player.z,this.hab.x,this.hab.z)<5.55&&player.y>this.habSeat.y){
                    player.y = this.habSeat.y+this.habSeat.h;
                }
            }
            this.cancelJump--;
        }

        
        c.syncToPlayer();
        c.viewControl();
        c.getComplexes();
        // if(c.canResetFOV){c.adjustFOVToRanges(1,1);}
        if(c.canResetFOV){c.adjustFOVToRanges(width/height,1);}
        c.customPlanes=[];
        
        if(player.boostCooldown>0){
            player.boostCooldown--;
            if(player.boostCooldown>10){
                player.yv = 0.35;
            }
        }
        else if(inp[16]&&player.inv.boosts>0){
            player.boostCooldown = 35;
            player.inv.boosts--;
            player.xv*=1.1;
            player.zv*=1.1;
            playNote(23,0,random(0.5,0.6),0,100,0.4);
        }
        createLightVector({x:0.1,y:-1,z:0.2},1,0.1);
        
        // drawLattice(0,5,7,0.6,[125,155,80,100],false);

        drawFloor(-0.000001,[141,170,95],false);
        if(drawQuad({
            v1:{x:c.x-1e10*(c.y+1),y:0,z:0},
            v2:{x:c.x+1e10*(c.y+1),y:0,z:0},
            v3:{x:c.x+1e10*(c.y+1),y:1e10+(c.y+1),z:-5e10-(c.y+1)},
            v4:{x:c.x-1e10*(c.y+1),y:1e10+(c.y+1),z:-5e10-(c.y+1)},
            col:[133,163,88],
        },true)){graphics[graphics.length-1].depth=1e10;}
        
        for(var i = -9; i<=9; i++){
            if(i===0) continue;
            if(drawQuad({
                v1:{x:-6+i*28,y:0,z:0},
                v2:{x:6+i*28,y:0,z:0},
                v3:{x:6+i*28,y:0,z:5e10},
                v4:{x:-6+i*28,y:0,z:5e10},
                col:[131,160,85,255-abs(i)*21],
            },true)){graphics[graphics.length-1].depth=2e9;}
            if(drawQuad({
                v1:{x:-6+i*28,y:0,z:0},
                v2:{x:6+i*28,y:0,z:0},
                v3:{x:6+i*28,y:1e10+(c.y+1),z:-5e10-(c.y+1)},
                v4:{x:-6+i*28,y:1e10+(c.y+1),z:-5e10-(c.y+1)},
                col:[123,153,78,255-abs(i)*21],
            },true)){graphics[graphics.length-1].depth=2e9;}

        }


        if(drawQuad({
            v1:{x:-9,y:0,z:0},
            v2:{x:9,y:0,z:0},
            v3:{x:9,y:0,z:5e10},
            v4:{x:-9,y:0,z:5e10},
            col:[50,50,60],
        },true)){graphics[graphics.length-1].depth=1e9;}
        if(drawQuad({
            v1:{x:-9,y:0,z:0},
            v2:{x:9,y:0,z:0},
            v3:{x:9,y:1e10+(c.y+1),z:-5e10-(c.y+1)},
            v4:{x:-9,y:1e10+(c.y+1),z:-5e10-(c.y+1)},
            col:[45,45,55],
        },true)){graphics[graphics.length-1].depth=1e9;}
        if(drawQuad({
            v1:{x:-8,y:0,z:0},
            v2:{x:8,y:0,z:0},
            v3:{x:8,y:0,z:5e10},
            v4:{x:-8,y:0,z:5e10},
            col:[105,105,115],
        },true)){graphics[graphics.length-1].depth=1e9;}
        if(drawQuad({
            v1:{x:-8,y:0,z:0},
            v2:{x:8,y:0,z:0},
            v3:{x:8,y:1e10+(c.y+1),z:-5e10-(c.y+1)},
            v4:{x:-8,y:1e10+(c.y+1),z:-5e10-(c.y+1)},
            col:[95,95,105],
        },true)){graphics[graphics.length-1].depth=1e9;}
        if(drawQuad({
            v1:{x:-0.25,y:0,z:0},
            v2:{x:0.25,y:0,z:0},
            v3:{x:0.25,y:0,z:5e10},
            v4:{x:-0.25,y:0,z:5e10},
            col:[177,158,83,255],
        },true)){graphics[graphics.length-1].depth=1e9;}
        if(drawQuad({
            v1:{x:-0.25,y:0,z:0},
            v2:{x:0.25,y:0,z:0},
            v3:{x:0.25,y:1e10+(c.y+1),z:-5e10-(c.y+1)},
            v4:{x:-0.25,y:1e10+(c.y+1),z:-5e10-(c.y+1)},
            col:[167,148,73,255],
        },true)){graphics[graphics.length-1].depth=1e9;}



        let habDepth = -1;
        if(drawHotAirBalloon(this.hab.x,this.hab.y,this.hab.z,50,this.habAzimuth,[
            [215,93,78,255],
            [235,109,87,255],
            [159,69,71,255],
            [175,165,200,255], // light grey
            [104,102,176,255], // blue
            [202,50,121,255], // purple
            [235,109,87,255],
            [215,93,78,255],
            [227,196,90,255], // yellow
            [215,93,78,255],
            [180,210,90,255], // lime
            [235,109,87,255],
            [215,93,78,255],
            [175,165,200,255], // light grey
            [235,109,87,255],
            [159,69,71,255],
            [104,102,176,255], // blue
            [235,109,87,255],
            [159,69,71,255],
            [235,109,87,255],
            [159,69,71,255],
            [227,196,90,255],
            [159,69,71,255], // dark red
        ],true)){
            habDepth = graphics[graphics.length-1].depth;
        }

        
        for(var i = 0; i<solids.length; i++){
            solids[i].draw();
        }
        if(this.habSeat.draw()){
            if(habDepth!==-1){
                graphics[graphics.length-1].depth=habDepth+0.01-0.02*(c.y<this.habSeat.y+this.habSeat.h);
            }
        }

        
        drawSun(1e7,7.5e5,8,-72,28,50,[125,145,185,255],false);
        drawSun(1e7,8e5,10,-69,35,50,[130,150,190,255],false);
        drawSun(1e7,6e5,6,-65,30,50,[120,140,180,255],false);
        
        drawSun(1e7,7e5,8,-46,19,50,[125,145,185,255],false);
        drawSun(1e7,6e5,6,-36,20,50,[120,140,180,255],false);
        drawSun(1e7,8.5e5,10,-39,16,50,[130,150,190,255],false);

        drawSun(1e7,6e5,6,30,25,50,[120,140,180,255],false);
        drawSun(1e7,8e5,10,40,20,50,[130,150,190,255],false);
        drawSun(1e7,7e5,8,24,23,50,[125,145,185,255],false);

        drawSun(1e7,8.5e5,10,48,40,50,[130,150,190,255],false);
        drawSun(1e7,7e5,8,66,40,50,[125,145,185,255],false);
        drawSun(1e7,6e5,6,70,42,50,[120,140,180,255],false);

        drawSun(1e7,7e5,8,136,38,50,[125,145,185,255],false);
        drawSun(1e7,6.5e5,6,142,42,50,[120,140,180,255],false);
        drawSun(1e7,8e5,10,105,18,50,[130,150,190,255],false);
        drawSun(1e7,7.5e5,10,100,14,50,[120,140,180,255],false);
        
        drawSun(1e7,8.5e5,10,-105,23,50,[120,140,180,255],false);

        drawSun(1e7,6.5e5,6,-150,58,50,[130,150,190,255],false);
        
        if(player.pov===2){
            player.animate();
            player.draw(0);
        }
        else if(player.pov>=3){
            player.animate();
            player.draw(0.4);
        }
        
        push();
        translate(width/2,height/2);
        scale(1,-1);
        background(65,125,200);
        noStroke();
        
        displayGraphics();
        
        if(player.pov===1){
            drawCrossHair();
        }
        
        pop();

        for(var i = 0; i<player.inv.boosts&&i<50; i++){
            drawBoostIcon(50+i*40,height-55,20);  
        }
        
    },
    function(){
        oiers = [];
        solids = [];
        items = [];
        mannequins = [];
    }
),
Level.new(
    "Armistice Town",
    function(){
        resetPlayerAndCameraTo(-5,2,-8, 0,0,0);
        this.playerNaturalRad = player.rad;

        this.l = 0;
        this.remake = function(){
            solids = [];
            for(let x = 0; x<this.l; x++){
                for(let y = 0; y<this.l; y++){
                    for(let z = 0; z<this.l; z++){
                        //var MediumTree = function(x,y,z,h,azimuth,elevation,generationTries,generationRad,seed,trunkCol,leafCol,leafColVariation){
                        solids.push(MediumTree.new(x*7,y*7,z*7,2.2,0,90,20,3,1+x*this.l*this.l+y*this.l+z,[160,100,20],[20,140,35],25));
                    }
                }
            }
        }
        // this.remake();
        
        // let segSetting = {l:1,h:0.3,w:0.3,col:[200,200,230]};
        // this.limb = Limb.new({x:-6,y:2.5,z:0},{x:-5,y:0,z:0},[segSetting,segSetting,segSetting,{l:1,h:0.45,w:0.45,col:[130,130,160]}],10,0.3);
        this.warWalkers = [
            WarWalker.new(5,3,1,230),
            WarWalker.new(5,3,6,230),
            WarWalker.new(5,3,11,230),
            WarWalker.new(5,3,16,230),
        ];

        this.mat = [];

        for(let i = 0; i<20; i++){
            this.mat.push([]);
            for(let j = 0; j<20; j++){
                this.mat[i].push(0);
            }
        }
        for(let i = 0; i<this.mat.length; i++){
            for(let j = 0; j<this.mat[i].length; j++){
                if((random(0,5)<1&&(i&&j&&i<this.mat.length-1&&j<this.mat.length-1))){
                    this.mat[i][j] = 1;
                    if(i&&!this.mat[i-1][j]){this.mat[i-1][j] = 2;}
                    if(j&&!this.mat[i][j-1]){this.mat[i][j-1] = 2;}
                    if(i<this.mat.length-1&&!this.mat[i+1][j]){this.mat[i+1][j] = 2;}
                    if(j<this.mat[i].length-1&&!this.mat[i][j+1]){this.mat[i][j+1] = 2;}
                    solids.push(WindowBlock.new(i*7+3.5,4,j*7+3.5,3.5,4,3.5,0,[90,90,100],0.15,0.85,[100,180,255,80]));
                }
            }
        }

        this.bfsWanderPath = function(startX,startZ){
            let startI = floor(startX/7);
            let startJ = floor(startZ/7);
            if(startI<0||startJ<0||startI>=this.mat.length||startJ>=this.mat[0].length){
                return [];
            }

            let ar = oCopy(this.mat);
            let from = oCopy(this.mat); // elements are d. for dirx[d], dirz[d] pointing back to start
            let queueIn = [], queueOut = [];
            queueIn.push({i:startI,j:startJ});
            let dests = [];
            ar[startI][startJ] = 3;
            while(queueIn.length+queueOut.length>0){
                if(queueOut.length===0){
                    for(let k = queueIn.length-1; k>=0; k--){
                        queueOut.push(queueIn[k]);
                    }
                    queueIn = [];
                }
                let cur = queueOut.pop();
                for(let d = 0; d<4; d++){
                    let next = {i:cur.i+dirx[d],j:cur.j+dirz[d]};
                    if(next.i<0||next.j<0||next.i>=ar.length||next.j>=ar[0].length||ar[next.i][next.j]===1||ar[next.i][next.j]===3){
                        continue;
                    }
                    queueIn.push(next);
                    if(ar[next.i][next.j]===0){
                        dests.push(next);
                    }
                    ar[next.i][next.j] = 3;
                    from[next.i][next.j] = (d+2)%4;
                }
            }
            if(dests.length===0){
                return [];
            }
            else{
                let ret = [];
                let bot = dests[floor(random(0,dests.length))];
                while(bot.i!==startI||bot.j!==startJ){
                    bot.i+=dirx[from[bot.i][bot.j]];
                    bot.j+=dirz[from[bot.i][bot.j]];
                    ret.push({x:bot.i*7+3.5,y:0,z:bot.j*7+3.5});
                }
                // ret.reverse();
                return ret;
            }
        }
    },
    function(){
        graphics = [];
        graphicOrders = [];
        lightSources = [];
        lightVectors = [];
        colliders = [];

        // if(inp[84]){
        //     inp[84] = false;
        //     this.l++;
        //     this.remake();
        // }
        // if(inp[89]){
        //     inp[89] = false;
        //     this.l--;
        //     this.remake();
        // }
        
        
        
        for(var i = 0; i<solids.length; i++){
            solids[i].makeCollider();
        }
        for(let ww of this.warWalkers){
            ww.makeCollider();
        }
        
        colliders.push({idTag:-1,
            x:0,y:0,z:0,
            planeNorm:{x:0,y:1,z:0},
            type:"slp",
            giveJumpFunc:giveJump,
        }); // floor collider
        
        playerAndCameraManagement();
        
        if(player.standingOnWarWalker){
            player.rad = 3.49;
        }
        else{
            player.rad = this.playerNaturalRad;
        }

        createLightVector({x:0.1,y:-1,z:0.2},1,0.1);
        
        drawLattice(0,5,7,0.6,[70,70,80,160]);
        drawFloor(-0.000001,[75,75,85],true);
        
        for(var i = 0; i<solids.length; i++){
            solids[i].draw();
        }
        
        for(let ww of this.warWalkers){
            if(ww.path.length===0&&random(0,60)<1){
                ww.path = this.bfsWanderPath(ww.x,ww.z);
            }
            ww.nature();
            ww.friend();
            ww.followPath();
            ww.operate();
            ww.draw();
        }
        
        if(player.pov===2){
            player.animate();
            player.draw(0);
        }   
        else if(player.pov>=3){
            player.animate();
            player.draw(0.4);
        }
        
        
        
        push();
        translate(width/2,height/2);
        scale(1,-1);
        background(100,200,255);
        noStroke();
        
        displayGraphics();
        
        if(player.pov===1){
            drawCrossHair();
        }
        
        pop();
    },
    function(){
        solids = [];
        player.rad = this.playerNaturalRad;
    }
),

];
  
  wMap.units = [

  wMapUnit.new("demo level",-270,-270,[0,0,0]),
  wMapUnit.new("NPCity",-200,-270,[100,150,200]),
  wMapUnit.new("Zombies",-200,-200,[100,0,0]),
  wMapUnit.new("soft level",-130,-270,[180,180,120]),

  wMapUnit.new("Trees Don't Die",-200,0),
  wMapUnit.new("Trees Do Die",0,-50),
  wMapUnit.new("First Dream",50,-200),
  wMapUnit.new("Boing Boing",120,-200),
  wMapUnit.new("Suspiciously Warm Cliff",0,100),
  wMapUnit.new("Walking on Pillars",0,170),
  wMapUnit.new("Waking up Pillars",0,240),

  wMapUnit.new("SmhSphereSpiral",0,0,[0,255,255]),
  wMapUnit.new("Climate Change",200,0,[100,255,0]),
  wMapUnit.new("Piano",200,50,[255,255,255]),
  wMapUnit.new("Bagels",150,50,[250,210,100]),

  wMapUnit.new("T3D",175,150,[255,0,255]),
  wMapUnit.new("Parcore",-270,-200,[0,0,100]),
  wMapUnit.new("Microwave",-270,0,[255,255,190]),
  wMapUnit.new("Infinite Maze",200,-50,[90,100,110]),
  wMapUnit.new("Boids",200,200,[140,0,255]),
  wMapUnit.new("Hot Air Balloon",150,100,[255,0,0]),
  wMapUnit.new("Armistice Town",225,100,[255,210,0]),

  ];
  
  
  screen = "map";
  // skip map:
//   screen = "game"; switchToLevel(levels.length-1); ianime = 101;
  drawLogoScreen();

}
function windowResized() {
    resizeCanvas(windowWidth,windowHeight);
    c.syncToWidthHeight();
    // checking if paused makes behavior weird with multiple resizings
    if(paused){
        drawLogoScreen();
    }
}   



function draw(){
    ganime = anyModulo(ganime+1,360);
    let nfps = getFrameRate();
    if(ganime%15===0||nfps<fps*0.6){
        fps = nfps;
    }

    // let now = performance.now();
    // let delta = now - lastTime;
    // lastTime = now;
    // let fps = 1000 / delta;
  


  
  
    

    if(!paused){
        push();
        if(usingWebgl){
            translate(-width/2,-height/2);
        }
        if(ianime<=100){
            background(0);
            if(ianime>31){
                c.canResetFOV = false;
                c.adjustFOVToRanges(
                    min(1,0.4+map(pow(ianime-31,3),0,327000,0,0.6)),
                    min(1,0.45+map(pow(ianime-31,3),0,327000,0,0.55))
                );
                main();
                c.canResetFOV = true;
                c.adjustFOVToRanges(width/height,1);
                // just in case it breaks or smth make sure it can auto FOV from there
            }
            drawT3dLogo(width/2,height/2,min(width,height)/5,ianime,true);
            // ianime+=1;
            ianime+=2;
        } // intro animation
        else{
            main();
            
    
    
    
            doScripts();
    
    
            ////// node generation in draw function
            if(generateAudioNodes && mainAudioNodesCloned<sounds.length){
                audioNodeGroups.generateNewClone(mainAudioNodesCloned);
                audioNodeGroups.generateNewClone(mainAudioNodesCloned);
                audioNodeGroups.generateNewClone(mainAudioNodesCloned);
                
                audioNodeGroups.generateNewClone(19); // this is just here for convenience. it doesn't need to be exactly 33 additional nodes
                
                mainAudioNodesCloned++;
                if(mainAudioNodesCloned===sounds.length){
                    // playSongDontForget();
                }
            }
            ///////////////
            for(var i = 0; i<audioNodeGroups.length; i++){
                for(var j = 0; j<audioNodeGroups[i].length; j++){
                    if(audioNodeGroups[i][j].lifetime<=0){
                        audioNodeGroups[i][j].lifetime=0;
                        audioNodeGroups[i][j].pause();
                        audioNodeGroups[i][j].currentTime=0; // typically redundant (is set on playing)
                    }
                    else{
                        audioNodeGroups[i][j].lifetime--;
                    }
                }
            }
        }
        pop();
    }
};
