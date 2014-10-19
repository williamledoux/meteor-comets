//-----------------------------------------------------------------------------
// CONFIG
var config={
  'framerate'         : 1000/60, // 60 FPS
  'originX'           : 400,
  'originY'           : 400,
  'minRadius'         : 150,
  'maxRadius'         : 380,
  'appearanceDuration': 1000, 
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
});
//-----------------------------------------------------------------------------
// D3 COMETS RENDERING
var CometsRenderer = function(selector, config){
  var self=this;

  self.selector = selector;
  self.comets=[];
  self.time = 0;
  self.framerate          = config.framerate          || 1000/60; // 60 FPS
  self.originX            = config.originX            || 400;
  self.originY            = config.originY            || 400;
  self.minRadius          = config.minRadius          || 150;
  self.maxRadius          = config.maxRadius          || 380;
  self.appearanceDuration = config.appearanceDuration || 1000;

  self.bindCenterX = function(d, i){
    return (self.originX + d.rotation_radius * Math.cos((self.time+d.rotation_start_angle)*d.speed*Math.PI/180)); 
  };
  self.bindCenterY = function(d, i){
    return (self.originY + d.rotation_radius * Math.sin((self.time+d.rotation_start_angle)*d.speed*Math.PI/180)); 
  };
  self.bindFutureCenterX = function(d, i){
    return (self.originX + d.rotation_radius * Math.cos((self.futureTime+d.rotation_start_angle)*d.speed*Math.PI/180)); 
  };
  self.bindFutureCenterY = function(d, i){
    return (self.originY + d.rotation_radius * Math.sin((self.futureTime+d.rotation_start_angle)*d.speed*Math.PI/180)); 
  };
  self.bindCenterRadius = function(d){
    return d.center_size; 
  };
  self.bindCenterColor = function(d){
    return d.center_color; 
  };
  self.bindStrokeSize = function(d){
    return d.stroke_size; 
  };
  self.bindStrokeColor = function(d){
    return d.stroke_color; 
  };

  Meteor.setInterval(function(){
    self.render();
  }, self.framerate);
};
//-----------------------------------------------------------------------------
CometsRenderer.prototype = {
  //-----------------------------------------------------------------------------
  addComet : function(comet){
    this.comets.push(comet);
  },
  //-----------------------------------------------------------------------------
  removeComet : function(comet){
    this.comets = _.reject(this.comets, function(elt){ return elt._id == comet._id; });
  },
  //-----------------------------------------------------------------------------
  changeComet : function(comet){
    var Oldcomet = _.find(this.comets, function(elt){ return elt._id == comet._id; });
    for(var attr in comet ){
      if (comet.hasOwnProperty(attr)){
        Oldcomet[attr] = comet[attr];
      }
    }
  },
  //-----------------------------------------------------------------------------
  render : function(){
    var self=this;

    self.time = self.time+1;
    self.futureTime = self.time + self.appearanceDuration/self.framerate;

    var svg = d3.select(self.selector);
    var circles = svg.selectAll("circle").data(self.comets, function(d){return d._id;});

    circles.enter()
           .append("circle")
           .each(function(d,i){d.lifetime=-1;})
           .attr({
              'cx'           : self.originX,
              'cy'           : self.originY,
              'r'            : 2,
              'fill'         : "#ffffff",
              'stroke'       : 1,
              'stroke-width' : "#ffffff",
            })
           .transition()
           .each("end", function(d,i){d.lifetime=0;})
           .duration(self.appearanceDuration)
           .attr({
              'cx'           : self.bindFutureCenterX,
              'cy'           : self.bindFutureCenterY,
              'r'            : self.bindCenterRadius,
              'fill'         : self.bindCenterColor,
              'stroke'       : self.bindStrokeColor,
              'stroke-width' : self.bindStrokeSize,
            });

    circles.filter(function(d) { return d.lifetime>=0; })
           .attr({
                'cx'           : self.bindCenterX,
                'cy'           : self.bindCenterY,
                'r'            : self.bindCenterRadius,
                'fill'         : self.bindCenterColor,
                'stroke'       : self.bindStrokeColor,
                'stroke-width' : self.bindStrokeSize,
              });

    circles.exit()
           .style("opacity","0")
           .remove();
  }
  //-----------------------------------------------------------------------------
};
//-----------------------------------------------------------------------------
Template.comets.rendered = function(){
  var renderer = new CometsRenderer("svg#comets", config);

  Comets.find().observe({
    added: function (doc) {
      renderer.addComet(doc);
    },
    removed: function (doc) {
      renderer.removeComet(doc);
    },
    changed: function(doc){
      renderer.changeComet(doc);
    }
  });

};
//-----------------------------------------------------------------------------