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
    'center_size'          : 11,
    'center_color'         : "#FFFFFF",
    'stroke_size'          : 1,
    'stroke_color'         : "#231F20",
    'tails'                : [
      {
        'offset' : -10,
        'width'  : 1,
        'length' : 5,
        'color'  : "#FFFFFF",
        'opacity': 0.1
      },
      {
        'offset' : -8,
        'width'  : 1,
        'length' : 15,
        'color'  : "#FFFFFF",
        'opacity': 0.2
      },
      {
        'offset' : -6,
        'width'  : 1,
        'length' : 30,
        'color'  : "#FFFFFF",
        'opacity': 0.3
      },
      {
        'offset' : -4,
        'width'  : 1,
        'length' : 45,
        'color'  : "#FFFFFF",
        'opacity': 0.4
      },
      {
        'offset' : -2,
        'width'  : 1,
        'length' : 60,
        'color'  : "#FFFFFF",
        'opacity': 0.5
      },
      {
        'offset' : 0,
        'width'  : 1,
        'length' : 75,
        'color'  : "#FFFFFF",
        'opacity': 0.6
      },
      {
        'offset' : 2,
        'width'  : 1,
        'length' : 60,
        'color'  : "#FFFFFF",
        'opacity': 0.5
      },
      {
        'offset' : 4,
        'width'  : 1,
        'length' : 45,
        'color'  : "#FFFFFF",
        'opacity': 0.4
      },
      {
        'offset' : 6,
        'width'  : 1,
        'length' : 30,
        'color'  : "#FFFFFF",
        'opacity': 0.3
      },
      {
        'offset' : 8,
        'width'  : 1,
        'length' : 15,
        'color'  : "#FFFFFF",
        'opacity': 0.2
      },
      {
        'offset' : 10,
        'width'  : 1,
        'length' : 5,
        'color'  : "#FFFFFF",
        'opacity': 0.1
      }
    ]
  });
});
//-----------------------------------------------------------------------------
// D3 COMETS RENDERING
var CometsRenderer = function(selector, config){
  var self=this;

  self.τ = 2 * Math.PI; // http://tauday.com/tau-manifesto
  self.selector = selector;
  self.comets=[];
  self.time = 0;
  self.framerate          = config.framerate          || 1000/60; // 60 FPS
  self.originX            = config.originX            || 400;
  self.originY            = config.originY            || 400;
  self.minRadius          = config.minRadius          || 150;
  self.maxRadius          = config.maxRadius          || 380;
  self.appearanceDuration = config.appearanceDuration || 1000;
  self.arc = d3.svg.arc()
    .innerRadius(function(d){ 
      return d.rotation_radius + d.offset;
    })
    .outerRadius(function(d){ 
      return d.rotation_radius + d.offset + d.width;
    })
    .startAngle(function(d){
      var t = d.rotation_clockwise ? (self.time*d.speed)%360 : -((self.time*d.speed)%360);
      var startAngle = self.τ/4 + (t+d.rotation_start_angle)*self.τ/360;
      //console.log(startAngle);
      return startAngle;
    })
    .endAngle(function(d){ 
      var t = d.rotation_clockwise ? (self.time*d.speed)%360 : -((self.time*d.speed)%360);
      var startAngle = self.τ/4 + (t+d.rotation_start_angle)*self.τ/360;
      var r = d.rotation_radius + d.offset + d.width/2;
      var deltaAngle = d.rotation_clockwise ? (d.length / r) : -(d.length / r);
      return startAngle - deltaAngle;
    });

  self.computePointX = function(d, time){
    var t = d.rotation_clockwise ? (time*d.speed)%360 : -((time*d.speed)%360);
    return (d.rotation_radius * Math.cos((t+d.rotation_start_angle)*self.τ/360)); 
  };
  self.computePointY = function(d, time){
    var t = d.rotation_clockwise ? (time*d.speed)%360 : -((time*d.speed)%360);
    return (d.rotation_radius * Math.sin((t+d.rotation_start_angle)*self.τ/360)); 
  };
  self.bindCenterX = function(d, i){
    return self.computePointX(d, self.time);
  };
  self.bindCenterY = function(d, i){
    return self.computePointY(d, self.time);
  };
  self.bindFutureCenterX = function(d, i){
    return self.computePointX(d, self.futureTime);
  };
  self.bindFutureCenterY = function(d, i){
    return self.computePointY(d, self.futureTime);
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
  checkComet : function(comet){
    //TODO: validate comet properties

    // Copy in each tail informations from the comet that are needed to render the tail
    for(var iTail=0; iTail<comet.tails.length; ++iTail){
      var tail = comet.tails[iTail];
      tail.rotation_radius = comet.rotation_radius;
      tail.rotation_start_angle = comet.rotation_start_angle;
      tail.rotation_clockwise = comet.rotation_clockwise;
      tail.speed = comet.speed;
    }
  },
  //-----------------------------------------------------------------------------
  addComet : function(comet){
    this.checkComet(comet);
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
    this.checkComet(Oldcomet);
  },
  //-----------------------------------------------------------------------------
  render : function(){
    var self=this;

    self.time = self.time+1;
    self.futureTime = self.time + self.appearanceDuration/self.framerate;

    var svg = d3.select(self.selector);
    var groups = svg.selectAll("g").data(self.comets, function(d){return d._id;});

    var groupsOnEnter=groups.enter()
          .append("g")
          .attr("transform", "translate(" + self.originX + "," + self.originY + ")");
    
    groupsOnEnter.selectAll("path").data(function(d){ return d.tails; }).enter()
        .append("path")
        .datum(function(d, i, j){return d;})
        .style("opacity", 0)
        .attr("d", self.arc);

    groupsOnEnter.append("circle")
             .each(function(d,i){d.lifetime=-1;})
             .attr({
                'cx'           : 0,
                'cy'           : 0,
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
   
    groups.selectAll("circle").filter(function(d) { return d.lifetime>=0; })
           .attr({
                'cx'           : self.bindCenterX,
                'cy'           : self.bindCenterY,
                'r'            : self.bindCenterRadius,
                'fill'         : self.bindCenterColor,
                'stroke'       : self.bindStrokeColor,
                'stroke-width' : self.bindStrokeSize,
              });

    groups.filter(function(d) { return d.lifetime>=0; }).selectAll("path").data(function(d){ return d.tails; })
        .datum(function(d, i, j){return d;})
        .style("fill", function(d){return d.color;})
        .style("opacity", function(d){return d.opacity;})
        .attr("d", self.arc);        

    groups.exit()
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