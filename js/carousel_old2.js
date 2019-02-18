
/**
* super simple carousel
* animation between panes happens with css transitions
*/
function Carousel(element)
{
    var self = this;
    element = $(element);

    var container = $(">ul", element);
    var panes = $(">ul>li", element);

    var pane_width = 0;
    var pane_count = panes.length;

    var current_pane = 1;

    // Enable Infinite Scrolling
    var enableInfiniteScrolling = true;

    // Pinch
    var pinching = false;
    var ticking = false;
    var draggingInPicture = false;
    var xPercentage; 
    var yPercentage;
    var additionalxPercentage;
    var additionalyPercentage;

    var image = {
        lastX: 0,
        lastY: 0,
        lastZ: 1,
        x: 0,
        y: 0,
        z: 1};

    function resetElement() {
        
        var currPane = document.querySelector("#ul").children[current_pane].children[0];
        currPane.className = 'animate';

        image.lastX = 0
        image.lastY = 0
    
        requestElementUpdate();
    }

    function updateElementTransform(x, y, scale) {
        const value = 'translateX(' + x + 'px) translateY(' + y + 'px) scale(' + scale + ',' + scale + ')';// rotate3d('+ transform.rx +','+ transform.ry +','+ transform.rz +','+  transform.angle + 'deg)';

        var currPane = document.querySelector("#ul").children[current_pane].children[0];
        currPane.style.webkitTransform = value;
        currPane.style.mozTransform = value;
        currPane.style.transform = value;
        ticking = false;
    }

    function requestElementUpdate() {
        updateElementTransform(image.x, image.y, image.z);
    }

    /**
     * initial
     */
    this.init = function() {
        setPaneDimensions();

        $(window).on("load resize orientationchange", function() {
            setPaneDimensions();
        })

        resetElement();

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
        image.z = 1;

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
    }

    this.next = function() { return this.showPane(current_pane+1, true); };
    this.prev = function() { return this.showPane(current_pane-1, true); };

    function onPan(ev) {
        console.log("onPan");
        if (!pinching && image.z == 1) {
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
        } else if (image.z != 1 && !draggingInPicture) {
            draggingInPicture = true;
            console.log("Enabled draggingInPicture");
        }
        if (draggingInPicture) {

            image.x = image.lastX + ev.deltaX;
            image.y = image.lastY + ev.deltaY;
            
            console.log(image.x, image.y);
            
            if (!pinching) {
                requestElementUpdate();
            }
        }
    }
    function onPanRelease(ev) {
        console.log("onPanRelease");

        if (image.z == 1) {
            if (Math.abs(ev.deltaX) > pane_width/2) {
                if(ev.direction == 'right') {
                    self.prev();
                } else {
                    self.next();
                }
            } else if (Math.abs(ev.deltaX) < 5) {
                self.showPane(current_pane, false);
            } else {
                self.showPane(current_pane, true);
            }
            resetElement();
        } else if (draggingInPicture) {
            console.log("Disabled draggingInPicture");
            draggingInPicture = false;
            pinching = false;
            image.lastX = image.x;
            image.lastY = image.y;
        }
    }
    function onRotate(ev) {
        console.log("onRotate");
    }
    function onPinch(ev) {
        console.log("onPinch");
        if (ev.type == "pinchstart") {
            console.log("onPinchStart");
            // Update current Image Position
            var pane_offset = -(100/pane_count)*current_pane;
            setContainerOffset(pane_offset, false)

            // Start Pinching
            image.lastZ = image.z || 1;
            image.z = image.lastZ;
            pinching = true;

            // Calculate Percentage

            console.log((ev.center.x - (image.x - (pane_width * (image.z - 1) * 0.5))) / (pane_width * image.z) - 0,5);


            xPercentage = -0.5 + (ev.center.x - (image.x - (pane_width * (image.z - 1)))) / (pane_width * image.z);
            yPercentage = -0.5 + (ev.center.y - (image.y - (container[0].clientHeight * (image.z - 1)))) / (container[0].clientHeight * image.z);
            additionalxPercentage = 0.5 - xPercentage;
            additionalyPercentage = 0.5 - yPercentage;
            
        } else if (ev.type == "pinchend" || ev.type == "pinchcancel") {

            console.log("onPinchRelease");

            pinching = false;

            image.lastX = image.x;
            image.lastY = image.y;
        }

        console.log((ev.center.x - (image.x - (pane_width * (image.z - 1) * 0.5))) / (pane_width * image.z) * 2 - 1);

        // Apply Scale
        var currPane = document.querySelector("#ul").children[current_pane].children[0];
        currPane.className = '';
        var lastZ = image.z;
        image.z = ev.scale * image.lastZ;

        // Apply Finger Position
        xLastOffset = (image.lastZ - 1) * pane_width;
        xOffset = (image.z - 1) * pane_width;
        yLastOffset = (image.lastZ - 1) * container[0].clientHeight;
        yOffset = (image.z - 1) * container[0].clientHeight;

        image.x += -xOffset * xPercentage;
        image.y += -yOffset * yPercentage;
        console.log(-xOffset * xPercentage);
        console.log(-yOffset * yPercentage);

        //requestElementUpdate();
        updateElementTransform(image.x, image.y, image.z);
    }

    function onSwipeLeft(ev) {
        console.log("onSwipeLeft");
        if (!pinching && image.z == 1) {
            self.next();
        } else {
            console.log("onSwipeLeftCancelled");
        }
    }
    function onSwipeRight(ev) {
        console.log("onSwipeRight");
        if (!pinching && image.z == 1) {
            self.prev();
        } else {
            console.log("onSwipeRightCancelled");
        }
    }
    function onTap(ev) {
        console.log("onTap");

        console.log((ev.center.x - (image.lastX - (pane_width * (image.z - 1)))) / (pane_width * image.z));
        console.log((ev.center.x - (image.lastX - (pane_width * (image.z - 1) * 0.5))) / (pane_width * image.z) * 2 - 1);
    }
    function onDoubleTap(ev) {
        console.log("onDoubleTap");
    }

    var el = document.querySelector("#hammer");

    var mc = new Hammer.Manager(el);

    mc.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));

    mc.add(new Hammer.Swipe()).recognizeWith(mc.get('pan'));
    mc.add(new Hammer.Rotate({ threshold: 0 })).recognizeWith(mc.get('pan'));
    mc.add(new Hammer.Pinch({ threshold: 0 })).recognizeWith([mc.get('pan'), mc.get('rotate')]);

    mc.add(new Hammer.Tap({ event: 'doubletap', taps: 2 }));
    mc.add(new Hammer.Tap());

    mc.on("panstart panmove", onPan);
    mc.on("panend pancancel", onPanRelease);
    mc.on("rotatestart rotatemove", onRotate);
    mc.on("pinchstart pinchmove", onPinch);
    mc.on("swipeleft", onSwipeLeft);
    mc.on("swiperight", onSwipeRight);
    mc.on("tap", onTap);
    mc.on("doubletap", onDoubleTap);
}


var carousel = new Carousel("#carousel");
carousel.init(); 