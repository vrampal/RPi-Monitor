var activestat;
var graphconf;
var activePage;
var static;

function Start() {
  static = getData('static')
  
  graphconf = getData('statistics')
    
  activestat = localStorage.getItem('activestat') || 0;
  activePage = GetURLParameter('activePage');
  if ( typeof activePage == 'undefined' ) { 
    activePage=localStorage.getItem('activePage', activePage); 
    if ( activePage == null ) { activePage = 0 }
  }
  localStorage.setItem('activePage', activePage);
  if ( graphconf.length > 1 ) {
    $('<h2><p class="text-info">'+graphconf[activePage].name+'</p></h2><hr>').insertBefore("#insertionPoint");
  }

  localStorage.setItem('activePage', activePage);
  FetchGraph();
}

function SetGraphlist() {
  var graphlist = "Graph: <select id='selected_graph'>\n";
  for (var iloop = 0; iloop < graphconf[activePage].content.length; iloop++) {
    graphlist += "<option value='" + iloop + "'";
    if (activestat == iloop) {
      graphlist += " selected ";
    }
    graphlist += ">" + graphconf[activePage].content[iloop].name + "</option>\n";
  }
  graphlist += "</select>\n";

  $("#mygraph_res_title").html(graphlist);
  
  $('#selected_graph').on('change', function (e) {
    activestat = this.value;
    localStorage.setItem('activestat', activestat);
    FetchGraph();
  });
}

function FetchGraph() {
  $('#preloader').removeClass('hide');
  if ( activestat >= graphconf[activePage].content.length ){
    activestat = 0;
    localStorage.setItem('activestat', activestat);
  }
  graph = graphconf[activePage].content[activestat].graph;
  for ( var iloop = 0; iloop < graph.length; iloop++) {
    if (  ( static==null ) || ( eval ( "static."+graph[iloop] ) ) ){
      try {
        FetchBinaryURLAsync('stat/empty.rrd', UpdateHandler, iloop);
      }
      catch (err) {
        alert("Failed loading stat/empty.rrd\n" + err);
      }
    }
    else {
      try {
        FetchBinaryURLAsync('stat/' + graph[iloop] + '.rrd', UpdateHandler, iloop);
      }
      catch (err) {
        alert("Failed loading stat/" + graph[iloop] + ".rrd\n" + err);
      }
    }
  }
}

function UpdateHandler(bf, idx) {
  graph = graphconf[activePage].content[activestat].graph;
  try {
    rrd_data[idx] = new RRDFile(bf);
  } catch (err) {
    alert("File stat/" + graph[idx] + ".rrd is not a valid RRD archive!");
  }
  PrepareGraph(idx);
  ready = 0;
  for (var iloop = 0; iloop < graph.length; iloop++) {
    if (rrd_data[iloop] != undefined) {
      ready++
    }
  }
  if (ready == graph.length) {
    UpdateGraph()
  }
}

function DoNothing(ds_name) {
  this.getName = function () {
    return ds_name;
  }
  this.getDSNames = function () {
    return [ds_name];
  }
  this.computeResult = function (val_list) {
    return val_list[0];
  }
}

function Zero(ds_name) { //create a fake DS.
  this.getName = function () {
    return ds_name;
  }
  this.getDSNames = function () {
    return [];
  }
  this.computeResult = function (val_list) {
    return 0;
  }
}

function SetValue(ds_name,value) { //create a fake DS.
  this.getName = function () {
    return ds_name;
  }
  this.getDSNames = function () {
    return [];
  }
  this.computeResult = function (val_list) {
    return value;
  }
}


function PrepareGraph(idx) {
  // http://javascriptrrd.sourceforge.net/docs/javascriptrrd_v0.6.0/src/examples/rrdJFlotFilter.html
  // http://sourceforge.net/p/javascriptrrd/discussion/914914/thread/935d8541/#17d3
  // Create a RRDFilterOp object that has the all DS's, with the one
  // existing in the original RRD populated with real values, and the other set to 0.
  graph = graphconf[activePage].content[activestat].graph;
  var op_list = []; //list of operations
  //create a new rrdlist, which contains all original elements (kept the same by DoNothing())
  for (var iloop = 0; iloop < graph.length; iloop++) {
    if (iloop != idx) {
      op_list.push(new Zero(graph[iloop]));
    }
    else {
      // If the graph should represent a static data, construct the line
      if ( rrd_data[idx].getDS(0).getName() == "empty" ) {
        op_list.push(new SetValue( graph[iloop], eval( "static."+graph[iloop] ) ) );
      }
      else {
        op_list.push(new DoNothing(rrd_data[idx].getDS(0).getName()));
      }
    }
  }
  rrd_data[idx] = new RRDFilterOp(rrd_data[idx], op_list);
}

function UpdateGraph() {
  graph_options={};
  active_rra=localStorage.getItem('active_rra') || 0;
  rrdflot_defaults={ graph_width:"750px",graph_height:"285px", scale_width:"350px", scale_height:"90px", use_rra:true, rra:active_rra };
  options = graphconf[activePage].content[activestat];
  ds_graph_options = options.ds_graph_options;

  for(var graph in ds_graph_options) {
    for(var param in ds_graph_options[graph]) {
      try {
        ds_graph_options[graph][param]=eval('(' + ds_graph_options[graph][param] + ')');
      }
      catch(e) {
      }
    }
  }
 
  if ( options.graph_options ) {
    for(var param in options.graph_options) {
      try {
        graph_options[param]=eval('(' + options.graph_options[param] + ')');
      }
      catch(e) {
      }
    }
  }

  rrd_data_sum = new RRDFileSum( rrd_data );
  var f = new rrdFlot("mygraph", rrd_data_sum, graph_options, ds_graph_options, rrdflot_defaults );
  SetGraphlist();
  $('#preloader').addClass('hide');
  $('#Legend').addClass('hide');
}

$(function () {
  // Remove the Javascript warning
  document.getElementById("infotable").deleteRow(0);

  rrd_data = [];

  $.ajaxSetup({
    cache : false
  });

  ShowFriends();

  Start();
});
