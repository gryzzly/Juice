(function (S,$)
{   var ns = 'Sonic';
/* Convenience variables (Mostly for saving keystrokes)
---------------------------------------------------- */
    var NIL = function(){};
//Animation Namespace
    (function(S, A)
    {   var namespace = ns + '.Animation';
    
        A.prototype = {
            play: function() {
                var _ = this;
                    console.log(_);
                var fps = _.fps,
                    len = _.length,
                    sec = 1e3,
                    nFrames = fps * (len / sec);
                _.maxFrames = nFrames;
            // Setup the animation
                _.setup(_);
                _.loops = 0;
                _.isStopped = false;
            // Clear the timer, in case of multiple play()s
                if (_.timer)
                    clearInterval(_.timer);
            // Begin drawing
                _.timer = setInterval(
                    function() {
                        if (!(_.isStopped)) _.draw();
                        else  clearInterval(_.timer);
                    }, 
                    1e3 / fps
                );    
            },
            stop: function() {
                this.isStopped = false;
            // Clear the timer, in case of multiple play()s
                if (this.timer)
                    clearInterval(this.timer);
            },

            draw: function () 
            {   var _ = this,
                    f = _.frame,
                    max = _.maxFrames,
                    c2d = _.context,
                    cache = _.cache;
                
            // Init frames
                if (!f) _.frame = 0;
            // Clear the image entirely
                c2d.clearRect(0, 0, _.fullWidth, _.fullWidth);
            // If frame is cached, draw immediately
                if (f in cache)
                    c2d.putImageData(cache[f], 0, 0)
            // Otherwise draw the frame manually
                else _.cache[f] = _.drawFrame();
                
            // Increment the frame and store it.
                if (++_.frame >= max)
                {   _.loops++;
                    _.frame = 0;
                    if (_.onLoop)
                        _.onLoop(_.loops);
                }
            },
            
            drawFrame: function () 
            {   var _ = this,
                    f = _.frame,
                    c2d = _.context;
            // Image Properties
                var w = _.fullWidth, 
                    h = _.fullHeight;
                    
                c2d.globalAlpha = _.alpha;
                $.each(_.points, function() {
                    this.draw(f / _.maxFrames);
                });
                //options.teardown();
            // Cache the image
                return c2d.getImageData(0, 0, w, h);
            }
            
        };
    }
    (S, S.Animation = S.Animation || 
        function(data) 
        {//Initialize
            var d = !data ? {} : data;
        // Set defaults... the hard way!
            this.cssID = !d.cssID ? null : d.cssID;
            this.cssClass = !d.cssClass ? ns : d.cssClass;
            this.width  = !d.width  ? 50 : d.width;
            this.height = !d.height ? 50 : d.height;
            this.padding = !d.padding ? 0 : d.padding;
            this.fullWidth = this.width + 2 * this.padding;
            this.fullHeight = this.height + 2 * this.padding;
        // Animation Defaults
            this.cache = [];
            this.context = !d.context ? null : d.context;
            this.length = !d.length ? 1000 : d.length;
            this.fps = !d.fps ? 30 : d.fps;
            this.alpha = !d.alpha ? 1 : d.alpha;
        // Global Fallbacks
            this.ptSize = !d.ptSize ? 10 : d.ptSize;
        // Animation Functions
            this.setup = !d.setup ? NIL : d.setup;
            //this.preStep = !d.preStep ? NIL : d.preStep;
            //this.teardown = !d.teardown ? NIL : d.teardown;
            //this.complete = !d.complete ? NIL : d.complete;
            this.onLoop = !d.onLoop ? NIL : d.onLoop;
        // Child Objects w/o Siblings
            trl = !d.trail ? {} : d.trail;
            this.trail = new Sonic.Trail(trl);
        // Child Objects w/ Siblings
            this.points = [];
            pts = !d.points ? [{}] : d.points;
            var l = pts.length;
            for (var i = 0; i < l; i++) 
            {// Create the new element...
                this.points[i] = new Sonic.Point(this, pts[i]);
            }
        // Return the results            
            return this;
        }
    ));
    
    (function(S, P)
    {//Namespace
        var namespace = ns + '.Point';
    // Inherited Functions
        P.prototype.draw = function(p) 
        {//Initialize
            var _ = this, 
                t = _.trail,
                ptProgress = 0;
            for (var pt = 0, a = t.points + 1; pt++ < a  && !_.isStopped;)
            {   ptProgress = p - ((a - pt) * t.distance);
                if (ptProgress < 0)
                    ptProgress = ptProgress + 1;
                this.modifier = (pt / a);
               //options.preStep();
                if (this.paths)
                {   _.path = _.paths;
                    if (typeof _.paths == 'function')
                        _.paths(ptProgress, _);
                    else if (typeof _.paths == 'object')
                    {   _.paths.draw(ptProgress, _);
                    }
                }
            // Default to global Step() function
                else
                    ;//_.step(ptProgress, this);
            }
        };
        P.prototype.canFade = function() {
            return this.trail.fade;
        };
        P.prototype.canResize = function() {
            return this.trail.transform;
        };
        P.prototype.onDestroy = function() {
            if (this.Animation)
                this.Animation = null;
        };
    // Round Point Objects
        (function(P,C)
        {//Inherited Functions
            C.prototype.draw = P.prototype.draw;
            C.prototype.canFade = P.prototype.canFade;
            C.prototype.canResize = P.prototype.canResize;
            C.prototype.onDestroy = P.prototype.onDestroy;
        // New/Overridden Functions
            C.prototype.render = function(x,y) 
            {//ERROR:No Context
                if (this.Animation)
                    if (this.Animation.context)
                        c2d = this.Animation.context;
                    else console.log('Invalid Canvas Context2D');
                else console.log('This Point has no Animation');
            // Initialize
                x = !x ? 0 : x;
                y = !y ? 0 : y;
                var s = !(this.ptSize) ? 1 : this.ptSize;
                var a = s / 2;
            // Account for Trailing
                if (this.canResize())
                    s = s * this.modifier;
                if (this.canFade())
                    c2d.globalAlpha = this.alpha * this.modifier;
            // Draw the Point
                c2d.fillStyle = this.color;
                c2d.beginPath();
                c2d.arc(x,y,a,0,360,false);
                c2d.fill();
                c2d.closePath();
            };
        }
        (P, P.Round = P.Round 
        ||  function(anim, data)
            {//Initialize
                var d = !data ? {} : data;
            // Set the parent appropriately
                if (anim) this.Animation = anim;
            // Set defaults... the hard way!
                this.ptSize  = !d.size  ? anim.ptSize  : d.size;
                this.color = d.color ? d.color : anim.color;
                this.alpha = d.alpha ? d.alpha : anim.alpha;
                this.paths = new Sonic.Path(anim, d.paths);
            // Possible Siblings Objects Last
                this.trail = (!d.trail) 
                         ? new Sonic.Trail(anim.trail) 
                         : new Sonic.Trail(d.trail);
                if (this.trail)
                {   var t = this.trail, a = this.Animation;
                    this.trail.distance = (t.length / a.length) / (t.points + 1);
                }
            // Return the results            
                return this;
            }
        ));
    // Rectangular Point Objects
        (function(P,R)
        {//Inherited Functions
            R.prototype.draw = P.prototype.draw;
            R.prototype.canFade = P.prototype.canFade;
            R.prototype.canResize = P.prototype.canResize;
            R.prototype.onDestroy = P.prototype.onDestroy;
        // New/Overridden Functionality
            R.prototype.render = function(x,y) 
            {//ERROR:No Context
                if (this.Animation)
                    if (this.Animation.context)
                        c2d = this.Animation.context;
                    else console.log('Invalid Canvas Context2D');
                else console.log('This Point has no Animation');
            // Initialize
                x = !x ? 0 : x;
                y = !y ? 0 : y;
                var s = !this.ptSize ? 1 : this.ptSize;
                var a = s / 2;
            // Account for Trailing
                if (this.canResize())
                    s = s * this.modifier;
                if (this.canFade())
                    c2d.globalAlpha = this.alpha * this.modifier;
            // Draw the Point
                c2d.fillStyle = this.color;
                c2d.fillRect(x-a,y-a,s,s);
            };
        }
        (P, P.Rect = P.Rect 
        ||  function(anim, data) 
            {//Initialize
                var d = !data ? {} : data;
            // Set the parent appropriately
                if (anim) this.Animation = anim;
            // Set defaults... the hard way!
                this.ptSize  = !d.size ? anim.ptSize : d.size;
                this.color = d.color ? d.color : anim.color;
                this.alpha = d.alpha ? d.alpha : anim.alpha;
                this.paths = new Sonic.Path(anim, d.paths);
            // Possible Siblings Objects Last
                this.trail = (!d.trail) 
                         ? new Sonic.Trail(anim.trail) 
                         : new Sonic.Trail(d.trail);
                if (this.trail)
                {   var t = this.trail, a = this.Animation;
                    this.trail.distance = (t.length / a.length) / (t.points + 1);
                }
            // Return the results            
                return this;
            }
        ));
    }
    (S, S.Point = S.Point || 
        function(anim, data)
        {//Initialize
            var d = !data ? {} : data;
        // Get the right kind of Point
            this.type = !d.type ? 'rect': d.type;
            if (this.type == 'round')
                return new S.Point.Round(anim, data);
            else
                return new S.Point.Rect(anim, data);
        }
    ));
    
    (function(S,T)
    {}
    (S, S.Trail = S.Trail 
    ||  function(data)
        {//Initialize
            var data = !data ? {} : data;
        // Save keystrokes
            var me = this, d = data;
        // Set defaults... the hard way!
            me.length    = !d.length    ?  500 : d.length;
            me.points    = !d.points    ?   10 : d.points;
            me.fade = !d.fade ? typeof d.fade == 'undefined' ? true : d.fade : d.fade;
            me.transform = !d.transform ? typeof d.transform == 'undefined' ? false : d.transform : d.transform;
        // Return the results            
            return me;
        }
    ));
    
    (function(S,P)
    {
        (function(P,L)
        {   L.prototype.draw = function (progress, pt) {
                var x = this.startX + ((this.endX - this.startX) * progress),
                    y = this.startY + ((this.endY - this.startY) * progress);
                pt.render(x,y);
            };
        
        }(P, P.Line = P.Line 
        ||  function(anim, data) 
            {   var d = !data ? {} : data;
                this.startX = d.startX;
                this.startY = d.startY;
                this.endX = d.endX;
                this.endY = d.endY;
                return this;
            }
        ));
        (function(P,A)
        {   A.prototype.draw = function (progress, pt) {
                var ctrX    = this.ctrX,
                    ctrY    = this.ctrY,
                    adj     = pt.ptSize / 2,
                    r       = this.radius - adj,
                    start   = this.start,
                    end     = this.end;
                    
                var angle = Math.PI * (end + (progress * (start - end))) / 180,
                    x = r * Math.sin(angle) + ctrX;
                    y = r * Math.cos(angle) + ctrY;
                pt.render(x,y);
            };
        
        }(P, P.Arc = P.Arc 
        ||  function(anim, data) 
            {   var d = !data ? {} : data;
                this.ctrX = d.ctrX;
                this.ctrY = d.ctrY;
                this.radius = d.radius;
                this.start = d.start;
                this.end = d.end;
                return this;
            }
        ));
        (function(P,E)
        {
        
        }(P, P.Ellipse = P.Ellipse 
        ||  function(anim, data) 
            {
                return this;
            }
        ));
        (function(P,B)
        {   B.prototype.draw = function (progress, pt) 
            {   var adj = pt.ptSize / 2;
                    
                var p1x = this.startX,
                    p1y = this.startY,
                    p2x = this.endX,
                    p2y = this.endY,
                    cp1x = this.cp1x,
                    cp1y = this.cp1y,
                    cp2x = this.cp2x,
                    cp2y = this.cp2y;
                
                var h = (1 - progress) * (1 - progress) * (1 - progress),
                    p = 3 * (1 - progress) * (1 - progress) * progress,
                    d = 3 * (1 - progress) * progress * progress,
                    v = progress * progress * progress;
                    
                var x = h * p1x + p * cp1x + d * cp2x + v * p2x,
                    y = h * p1y + p * cp1y + d * cp2y + v * p2y;
                    
                pt.render(x,y);
            };
        }(P, P.Bezier = P.Bezier 
        ||  function(anim, data) 
            {   d = !data ? {} : data;
                this.startX = d.startX;
                this.startY = d.startY;
                this.endX = d.endX;
                this.endY = d.endY;
                this.cp1x = d.cp1x;
                this.cp1y = d.cp1y;
                this.cp2x = d.cp2x;
                this.cp2y = d.cp2y;
                return this;
            }
        ));
        
    }
    (S, S.Path = S.Path 
    ||  function(anim, data) 
        {//Initialize
            var d = !data ? {} : data;
        // Save keystrokes
            var me = this;
        // Get the right kind of Point
            me.name = !d.name ? '': d.name;
            if (me.name == 'line')
                return new Sonic.Path.Line(anim, data);
            else if (me.name == 'arc')
                return new Sonic.Path.Arc(anim, data);
            else if (me.name == 'bezier')
                return new Sonic.Path.Bezier(anim, data);
            else if (me.name == 'ellipse')
                return new Sonic.Path.Ellipse(anim, data);
        }
    ));
    
    if ($)
    {// Sonic Namespace in $
        (function(S,$)
        {   S.Animation = Sonic.Animation;
            S.play = function(items)
            {   return $(items).each(function()
                {   var d = $(this).data(ns);
                    if (d instanceof Sonic.Animation)
                        d.play();
                });
            }
            S.stop = function(items)
            {   return $(items).each(function()
                {   var d = $(this).data(ns);
                    if (d instanceof Sonic.Animation)
                        d.stop();
                });
            }
        }
        ($.Sonic = $.Sonic || function(){return this.each(function(){return this;});}, $)); 
    //Sonic Namespace in $.fn
        (function(S,fn)
        {   
            S.methods = {
                init: function (options) {
                    var jQ = $,
                        link = jQFind(this, true);
                // Add the new links
                    link.play = jQPlay;
                    link.stop = jQStop;
                    tmpItems = link;
                // Add the loaders
                    $.each(link, function () 
                    {//Key savers
                        var me = this,
                            $me = $(this),
                            data = $me.data(ns);
                        
                    // If the plugin hasn't been initialized yet
                        if (!data) 
                        {//Clone options and attach to canvas
                            options.context = me.getContext('2d');
                            $me.data(ns, new Sonic.Animation(options));
                        // Save Keystrokes
                            data = $me.data(ns);
                            $me.attr('height', data.fullHeight);
                            $me.attr('width', data.fullWidth);
                        }
                    });
                    var $link = $(link);
                    $link.play = function() { return jQPlay($(link)); };
                    return $link;
                },
                play: function () {
                    var list = jQFind(this, false);
                    return jQPlay(list);
                },
                stop: function () {
                    var list = jQFind(this, false);
                    return jQStop(list);
                },
            };
            S.play = function() { return jQPlay(this.jQCache); }
            S.stop = function() { return jQStop(this.jQCache); }
        }
        
        ($.fn.Sonic = $.fn.Sonic || function (method)
        {   var ns = $.fn.Sonic;
            var fn = $.fn.Sonic.methods;
            
            if (fn[method]) 
            {
                return fn[method].apply(this, Array.prototype.slice.call(arguments, 1));
            } 
            else if (typeof method === 'object') 
            {
                return fn.init.apply(this, arguments);
            } 
            else if (typeof method == 'undefined') 
            {
                ns.jQCache = this;
                this.play = function() { return jQPlay(this);};
                this.stop = function() { return jQStop(this);};
                return this;
            }
        }, $.fn));
    };
    
    
    var tmpItems;

/* Actual Working Methods for the jQuery Plugin
   ---------------------------------------------------- */
/* Plays the list of Sonic Canvases. */
    var jQPlay = function(items)
    {   if (typeof items == 'undefined')
            items = tmpItems;
        return $.each(items, function () {
            var d = $(this).data(ns);
            if (d instanceof Sonic.Animation)
                d.play();
       });
    };
    
/* Stops the list of Sonic Canvases. */
    var jQStop = function(items)
    {   return $.each(items,function(){
            var d = $(this).data(ns);
            if (d instanceof Sonic.Animation)
                d.stop();
        });
    };
    
/* Helper Methods
   ---------------------------------------------------- */
/* Finds the Sonic objects in the given list. */
    var jQFind = function(items, addMissing)
    {   var list = [];
        items.each(function()
        {   if($(this).prop('tagName') != 'CANVAS')
            {   if (addMissing)
                {   var a = document.createElement('canvas');
                    $(a).addClass('Sonic');
                    $(this).prepend($(a));
                    list.push(a);
                }
            }
            else list.push(this);
        });
        return list;
    };
}
(window.Sonic = window.Sonic || function(){}, jQuery));
