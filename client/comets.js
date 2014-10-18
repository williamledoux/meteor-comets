//-----------------------------------------------------------------------------
// CONFIG
var config={
  'framerate'   : 1/60,
  'originX'     : 400,
  'originY'     : 400,
  'minRadius'   : 150,
  'maxRadius'   : 380,
};
//-----------------------------------------------------------------------------
// STARTUP
Comets = new Mongo.Collection(null); // full client connection for now
Meteor.startup(function(){ 

  Comets.insert({
    'speed'                : 1,
    'rotation_radius'      : 200,
    'rotation_start_angle' : 0, // in degrees
    'rotation_clockwise'   : true,
    'center_size'          : 5,
    'center_color'         : "#231F20",
    'stroke_size'          : 1,
    'stroke_color'         : "#FFFFFF",
    'center_tail_width'    : 3,
    'center_tail_length'   : 20,
    'center_tail_color'    : "#FFAA00",
    'left_tail_width'      : 2,
    'left_tail_length'     : 10,
    'left_tail_color'      : "#FF0000",
    'right_tail_width'     : 2,
    'right_tail_length'    : 30,
    'right_tail_color'     : "#FFFF00"
  });

  Session.set("time", 0);
  Meteor.setInterval(function(){
    Session.set("time", (Session.get("time")+1)%360 );
  }, config.framerate);

});
//-----------------------------------------------------------------------------
// D3 BINDINGS
var gTime;
function bindCenterX(d, i){ return (config.originX + d.rotation_radius * Math.cos((gTime+d.rotation_start_angle)*d.speed*Math.PI/180)); }
function bindCenterY(d, i){ return (config.originY + d.rotation_radius * Math.sin((gTime+d.rotation_start_angle)*d.speed*Math.PI/180)); }
function bindCenterRadius(d){ return d.center_size; }
function bindCenterColor(d){ return d.center_color; }
function bindStrokeSize(d){ return d.stroke_size; }
function bindStrokeColor(d){ return d.stroke_color; }
//-----------------------------------------------------------------------------
// D3 RENDERING
function render(){
  
  gTime = Session.get("time");
  var elements = Comets.find().fetch();
  var svg = d3.select("svg#comets");

  var circles = svg.selectAll("circle").data(elements, function(d){return d._id;});

  circles.enter().append("circle").attr({
              'cx'           : bindCenterX,
              'cy'           : bindCenterY,
              'r'            : bindCenterRadius,
              'fill'         : bindCenterColor,
              'stroke'       : bindStrokeColor,
              'stroke-width' : bindStrokeSize,
            });

  circles.attr({
              'cx'           : bindCenterX,
              'cy'           : bindCenterY,
              'r'            : bindCenterRadius,
              'fill'         : bindCenterColor,
              'stroke'       : bindStrokeColor,
              'stroke-width' : bindStrokeSize,
            });

  circles.exit()
         .style("opacity","0")
         .remove();
  
}
//-----------------------------------------------------------------------------
Template.comets.rendered = function(){
  this.autorun(render);
};
//-----------------------------------------------------------------------------