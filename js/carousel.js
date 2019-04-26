
/**
* super simple carousel
* animation between panes happens with css transitions
*/
function Carousel(element)
{
    var self = this;
    element = $(element);
    elementPinch = document.getElementById('ul');

    var container = $(">ul", element);
    var panes = $(">ul>li", element);

    var pane_width = 0;
    var pane_count = panes.length;

    var current_pane = 1;

    // Pinch
    var fixHammerjsDeltaIssue = undefined;
    var pinchStart = { x: undefined, y: undefined }
    var lastEvent = undefined;
    var pinching = false;
    var draggingInPicture = false;
    var velocityFriction = 0.06;
    var velocityFactor = 16;

    var originalSize = {
        width: 1920,
        height: 1080
    }

    var current = {
        x: 0,
        y: 0,
        z: 1,
        zooming: false,
        width: originalSize.width * 1,
        height: originalSize.height * 1,
    }

    var last = {
        x: current.x,
        y: current.y,
        z: current.z
    }

    function resetElement() {
        current = {
            x: 0,
            y: 0,
            z: 1,
            velocityX: 0,
            velocityY: 0,
            zooming: false,
            width: originalSize.width * 1,
            height: originalSize.height * 1,
        }
    
        last = {
            x: current.x,
            y: current.y,
            z: current.z,
            velocityX: 0,
            velocityY: 0,
        }
    }

    function getRelativePosition(element, point, originalSize, scale) {
        var domCoords = getCoords(element);

        var elementX = point.x - domCoords.x;
        var elementY = point.y - domCoords.y;

        var relativeX = elementX / (originalSize.width * scale / 2) - 1;
        var relativeY = elementY / (originalSize.height * scale / 2) - 1;

        return { x: relativeX, y: relativeY }
    }

    function getCoords(elem) { // crossbrowser version
	    var box = elem.getBoundingClientRect();

	    var body = document.body;
	    var docEl = document.documentElement;

	    var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
	    var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

	    var clientTop = docEl.clientTop || body.clientTop || 0;
	    var clientLeft = docEl.clientLeft || body.clientLeft || 0;

	    var top  = box.top +  scrollTop - clientTop;
	    var left = box.left + scrollLeft - clientLeft;

	    return { x: Math.round(left), y: Math.round(top) };
	}

    function scaleFrom(zoomOrigin, currentScale, newScale) {
        var currentShift = getCoordinateShiftDueToScale(originalSize, currentScale);
        var newShift = getCoordinateShiftDueToScale(originalSize, newScale)

        var zoomDistance = newScale - currentScale
        
        var shift = {
        	x: currentShift.x - newShift.x,
        	y: currentShift.y - newShift.y,
        }

        var output = {
            x: zoomOrigin.x * shift.x,
            y: zoomOrigin.y * shift.y,
            z: zoomDistance
        }
        return output
    }

    function getCoordinateShiftDueToScale(size, scale){
    	var newWidth = scale * size.width;
        var newHeight = scale * size.height;
    	var dx = (newWidth - size.width) / 2
    	var dy = (newHeight - size.height) / 2
    	return {
    		x: dx,
    		y: dy
    	}
    }

    function update() {
        current.height = originalSize.height * current.z;
        current.width = originalSize.width * current.z;
        var currPane = document.querySelector("#ul").children[current_pane].children[0];

        var value = "translate3d(" + current.x + "px, " + current.y + "px, 0) scale(" + Math.min(Math.max(current.z, 0.5), 6) + ")";
        console.log(value);
        currPane.style.webkitTransform = value;
        currPane.style.mozTransform = value;
        currPane.style.transform = value;
    }

    function keepViewInBounds() {
        var viewCoordinates = getCoordinateShiftDueToScale(originalSize, current.z);

        current.x = Math.min(Math.max(current.x, -viewCoordinates.x), viewCoordinates.x);
        current.y = Math.min(Math.max(current.y, -viewCoordinates.y), viewCoordinates.y);
        console.log(viewCoordinates);
    }

    // Enable Infinite Scrolling
    var enableInfiniteScrolling = true;

    function applyOffset() {
        var offset = -((100/pane_count)*current_pane);
        setContainerOffset(offset, false);
    }

    function handlePinchEnd(ev) {

        if ((ev.isFinal) && current.z < 1) {
            if (current.zooming === false) {
                current.zooming = true;
            } else {
                current.zooming = false;
            }

            elementPinch.style.transition = "0.35s";
            setTimeout(function() {
                elementPinch.style.transition = "none";
            }, 350)

            current.x = 0;
            current.y = 0;
            current.z = 1;

            last.x = current.x;
            last.y = current.y;
            last.z = current.z;

            update();

            draggingInPicture = false;
        }
    }

    function moveWithVelocity() {
        var velocity = Math.sqrt(Math.pow(current.velocityX, 2) + Math.pow(current.velocityY, 2));
        current.x = last.x + current.velocityX * velocityFactor;
        current.y = last.y + current.velocityY * velocityFactor;

        if (current.z > 1) {
            keepViewInBounds();
        }

        update();
        last.x = current.x;
        last.y = current.y;
        
        if (velocity > 0.05) {
            current.velocityX = current.velocityX - velocityFriction * (current.velocityX / velocity);
            current.velocityY = current.velocityY - velocityFriction * (current.velocityY / velocity);
            window.requestAnimationFrame(function(){
                moveWithVelocity();
            });
        }
    }

    function imageOutOfBounds() {
        var viewCoordinates = getCoordinateShiftDueToScale(originalSize, current.z);

        if (current.x > viewCoordinates.x
            || current.x < -viewCoordinates.x
            || current.y > viewCoordinates.y
            || current.y < -viewCoordinates.y) {

            return true;
        } else {
            return false;
        }
    }

    /**
     * initial
     */
    this.init = function() {
        setPaneDimensions();

        $(window).on("load resize orientationchange", function() {
            setPaneDimensions();
        })

        setContainerOffset(-(100/pane_count), false);
    };


    /**
     * set the pane dimensions and scale the container
     */
    function setPaneDimensions() {
        pane_width = element.width();
        panes.each(function() {
            $(this).width(pane_width);
        });
        container.width(pane_width*pane_count);
    };


    /**
     * show pane by index
     * @param   {Number}    index
     */
    this.showPane = function(index, animate) {

        // between the bounds
        var newIndex = Math.max(1, Math.min(index, pane_count-2));
        current_pane = newIndex;
        current.z = 1;

        // If out of bounds
        if (newIndex - index == 1) {
            current_pane = pane_count - 2;
        } else if (newIndex - index == -1) {
            current_pane = 1;
        }

        var offset = -((100/pane_count)*index);
        setContainerOffset(offset, animate);
    };


    function setContainerOffset(percent, animate) {
        container.removeClass("animate");

        if(animate) {
            container.addClass("animate");
        }
        container.css("transform", "translate3d("+ percent +"%,0,0) scale3d(1,1,1)");
        //console.log("Offset applied");
    }

    this.next = function() {
        if (current_pane == 1) {
            container.removeClass("animate");
            container.css("transform", "translate3d("+ -((100/pane_count)*current_pane) +"%,0,0) scale3d(1,1,1)");
            console.log("Offset fix");
            console.log(-((100/pane_count)*current_pane));
        }
        // Delay animation by one frame so the offset can be set correctly the frame before
        setTimeout(function(){
            //console.log("animate");
            self.showPane(current_pane + 1, true);
        }, 1000/60);
    };
    this.prev = function() {
        if (current_pane == pane_count - 2) {
            container.removeClass("animate");
            container.css("transform", "translate3d("+ -((100/pane_count)*current_pane) +"%,0,0) scale3d(1,1,1)");
            console.log("Offset fix");
            console.log(-((100/pane_count)*current_pane));
        }
        // Delay animation by one frame so the offset can be set correctly the frame before
        setTimeout(function(){
            //console.log("animate");
            self.showPane(current_pane - 1, true);
        }, 1000/60);
    };

    function onPan(ev) {
        console.log("onPan");
        if (!pinching && current.z == 1) {
            // stick to the finger
            var pane_offset = -(100/pane_count)*current_pane;
            var drag_offset = ((100/pane_width)*ev.deltaX) / pane_count;

            // slow down at the first and last pane
            if(((current_pane == 0 && ev.direction == Hammer2.DIRECTION_RIGHT) ||
                (current_pane == pane_count-1 && ev.direction == Hammer2.DIRECTION_LEFT))
                && !enableInfiniteScrolling) {
                drag_offset *= .4;
            }

            setContainerOffset(drag_offset + pane_offset);
        } else if (current.z != 1 && !draggingInPicture) {
            draggingInPicture = true;
            console.log("Enabled draggingInPicture");
        }
        if (draggingInPicture) {
            
            if (lastEvent !== 'pan') {
                fixHammerjsDeltaIssue = {
                    x: ev.deltaX,
                    y: ev.deltaY
                }
            }
    
            current.x = last.x + ev.deltaX - fixHammerjsDeltaIssue.x;
            current.y = last.y + ev.deltaY - fixHammerjsDeltaIssue.y;

            if (current.z > 1) {
                keepViewInBounds();
            }

            lastEvent = 'pan';
            update();
        }
    }
    function onPanRelease(ev) {
        console.log("onPanRelease");

        if (current.z == 1) {
            if (Math.abs(ev.deltaX) < 5) {
                self.showPane(current_pane, false);
            } else {
                self.showPane(current_pane, true);
            }
            resetElement();
        } else if (draggingInPicture) {

            draggingInPicture = false;
            last.x = current.x;
            last.y = current.y;
            // Init Momentum
            current.velocityX = ev.velocityX;
            current.velocityY = ev.velocityY;
            if (imageOutOfBounds()) {
                elementPinch.style.transition = "0.35s";
                setTimeout(function() {
                    elementPinch.style.transition = "none";
                }, 350)
            }
            moveWithVelocity();
            lastEvent = 'panend';
        }

        handlePinchEnd(ev);
    }
    function onRotate(ev) {
        console.log("onRotate");
    }

    var pinchZoomOrigin = undefined;
    function onPinch(ev) {
        console.log("onPinch");
        if (ev.type == "pinchstart") {
            console.log("onPinchStart");

            applyOffset();

            pinching = true;

            pinchStart.x = ev.center.x;
            pinchStart.y = ev.center.y;

            // Update zoomable Element
            elementPinch = document.querySelector("#ul").children[current_pane].children[0];
            if (current.z == 1) {
                originalSize = {
                    width: elementPinch.offsetWidth,
                    height: elementPinch.offsetHeight
                }
            }
            pinchZoomOrigin = getRelativePosition(elementPinch, { x: pinchStart.x, y: pinchStart.y }, originalSize, current.z);
            lastEvent = 'pinchstart';
            
        }

        // Reduce z if outside range: 1 < z < 3
        var zoomDifference = last.z * (ev.scale - 1);
        if (current.z < 1) {
            var startZ = last.z
            var offsetZ = startZ - 1;
            zoomDifference = last.z * (ev.scale - 1) / Math.pow(1 - (zoomDifference - offsetZ), 0.92) - (offsetZ - offsetZ / Math.pow(1 - (zoomDifference - offsetZ), 0.92));
        } else if (current.z > 3) {
            var startZ = last.z
            var offsetZ = 3 - startZ;
            zoomDifference = last.z * (ev.scale - 1) / Math.pow(1 + (zoomDifference - offsetZ), 0.92) + (offsetZ - offsetZ / Math.pow(1 + (zoomDifference - offsetZ), 0.92));
        }

        var d = scaleFrom(pinchZoomOrigin, last.z, last.z + zoomDifference);

        current.x = d.x + last.x + ev.deltaX;
        current.y = d.y + last.y + ev.deltaY;
        current.z = d.z + last.z;
        lastEvent = 'pinch';
        update();
    }

    function onPinchEnd(ev) {
        
        console.log("onPinchEnd");
        pinching = false;
        handlePinchEnd(ev);

        last.x = current.x;
        last.y = current.y;
        last.z = current.z;
        lastEvent = 'pinchend';

        // Check if image zoomed out too far
        if (current.z > 3) {
            elementPinch.style.transition = "0.35s";
            setTimeout(function() {
                elementPinch.style.transition = "none";
            }, 350)

            var zoomOrigin = getRelativePosition(elementPinch, { x: ev.center.x, y: ev.center.y }, originalSize, current.z);
            var d = scaleFrom(zoomOrigin, current.z, 3)
            current.x += d.x;
            current.y += d.y;
            current.z += d.z;

            last.x = current.x;
            last.y = current.y;
            last.z = current.z;

            update();
        }
    }

    function onSwipeLeft(ev) {
        console.log("onSwipeLeft");
        if (!pinching && current.z == 1) {
            self.next();
        } else {
            console.log("onSwipeLeftCancelled");
        }
    }
    function onSwipeRight(ev) {
        console.log("onSwipeRight");
        if (!pinching && current.z == 1) {
            self.prev();
        } else {
            console.log("onSwipeRightCancelled");
        }
    }
    function onTap(ev) {
        console.log("onTap");

        applyOffset();
        
        elementPinch = document.querySelector("#ul").children[current_pane].children[0];
        if (current.z == 1) {
            originalSize = {
                width: elementPinch.offsetWidth,
                height: elementPinch.offsetHeight
            }
        }

    }
    function onDoubleTap(ev) {
        console.log("onDoubleTap");
        console.log(current.z);
        if (current.z == 1) {
            var scaleFactor = 2;
            elementPinch.style.transition = "0.35s";
            setTimeout(function() {
                elementPinch.style.transition = "none";
            }, 350)

            var zoomOrigin = getRelativePosition(elementPinch, { x: ev.center.x, y: ev.center.y }, originalSize, current.z);
            var d = scaleFrom(zoomOrigin, current.z, current.z + scaleFactor)
            current.x += d.x;
            current.y += d.y;
            current.z += d.z;

            last.x = current.x;
            last.y = current.y;
            last.z = current.z;

            update();
        } else {

            elementPinch.style.transition = "0.35s";
            setTimeout(function() {
                elementPinch.style.transition = "none";
            }, 350)

            current.x = 0;
            current.y = 0;
            current.z = 1;

            last.x = current.x;
            last.y = current.y;
            last.z = current.z;

            update();
        }
    }

    function onHammerInput(ev) {
        //console.log(ev);
        if (ev.type == "hammer.input" && current.z < 1 && ev.isFinal) {
            handlePinchEnd(ev);
        } else if (ev.type == "hammer.input" && (current.velocityX != 0 || current.velocityX != 0)) {
            current.velocityX = 0;
            current.velocityY = 0;
        }
    }

    var el = document.querySelector("#hammer");
    var mc = new Hammer.Manager(el);
    mc.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));

    mc.add(new Hammer.Swipe()).recognizeWith(mc.get('pan'));
    mc.add(new Hammer.Rotate({threshold: 0})).recognizeWith(mc.get('pan'));
    mc.add(new Hammer.Pinch({threshold: 0, pointers: 2})).recognizeWith([mc.get('pan'), mc.get('rotate')]);

    mc.add(new Hammer.Tap({ event: 'doubletap', taps: 2, posThreshold: 50}));
    mc.add(new Hammer.Tap());

    mc.on("panstart panmove", onPan);
    mc.on("panend pancancel", onPanRelease);
    mc.on("rotatestart rotatemove", onRotate);
    mc.on("pinchstart pinchmove", onPinch);
    mc.on("pinchend", onPinchEnd);
    mc.on("swipeleft", onSwipeLeft);
    mc.on("swiperight", onSwipeRight);
    mc.on("tap", onTap);
    mc.on("doubletap", onDoubleTap);
    mc.on("hammer.input", onHammerInput);
}


var carousel = new Carousel("#carousel");
carousel.init(); 