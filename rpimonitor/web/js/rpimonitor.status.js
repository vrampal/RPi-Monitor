var strips;
var postProcessInfo=[];
var justgageId=0;
var postProcessCommand=[];

function RowTemplate(id,image,title){
  return ""+
        "<div class='row row"+id+"'>"+
          "<div class='Title'><img src='"+image+"' alt='"+title+"'> &nbsp;"+title+"</div>"+
          "<div class='Text' id='Text"+id+"'><b></b></div>"+
        "</div>"+
        "<hr class='row"+id+"'>"
}

function ActivatePopover(){
  for ( var iloop=0; iloop < postProcessInfo.length; iloop++) {
    $(postProcessInfo[iloop][0]).popover({trigger:'hover',placement:'bottom',html:true, title: postProcessInfo[iloop][1], content: postProcessInfo[iloop][2] });
  }
  $("#packages").popover();
}

function UpdateStatus () {
  $.getJSON('dynamic.json', function(data) {
    // Concatenate dynamic.json and static.json into data variable
    $.extend(data, getData('static'));

    $('#message').addClass('hide');

    for (var iloop=0; iloop < strips.length; iloop++){
      eval( 'visibility = '+strips[iloop].visibility ) 
      if ( visibility == 0) {
        $('.row'+iloop).addClass('hide')
      }
      else {
        $('.row'+iloop).removeClass('hide')
      }
      text = "";
      for (var jloop=0; jloop < strips[iloop].line.length; jloop++){
        var line = strips[iloop].line[jloop];
        text = text + "<p>";
        try {
            text = text + eval( line );
        }
        catch (e) {
          text = text + "ERROR: " + line + " -> " + e;
        }
        finally {
          text = text + "</p>";
        }
      }
      $("#Text"+iloop).html(text);    
    }
    
    while((command=postProcessCommand.pop()) != null) {
      eval( command )
    }
    
    ActivatePopover();

  })
  .fail(function() {
      $('#message').html("<span class='glyphicon glyphicon-warning-sign'></span> &nbsp; Can not get information (dynamic.json) from <b>RPi-Monitor</b> server.");
      $('#message').removeClass('hide');
    });

}

function ConstructPage()
{
  var activePage = GetURLParameter('activePage');

  if ( typeof activePage == 'undefined') {
    activePage=localStorage.getItem('activePage', activePage);
    if ( activePage ==null ) { activePage = 0 }
  };
  data = getData('status');
  if ( activePage >= data.length ){
    activePage=0;
  }
  localStorage.setItem('activePage', activePage);
  if ( data.length > 1 ) {
    $('<h2><p class="text-info">'+data[activePage].name+'</p></h2><hr>').insertBefore("#insertionPoint");
  }
  for ( var iloop=0; iloop < data[activePage].content.length; iloop++) {
    $(RowTemplate(iloop,"img/"+data[activePage].content[iloop].icon,data[activePage].content[iloop].name)).insertBefore("#insertionPoint");
    strips=data[activePage].content;
  }
  UpdateStatus();
}

$(function () {
  /* Set no cache */
  $.ajaxSetup({ cache: false });

  /* Show friends */
  ShowFriends();

  /* Add qrcode shortcut*/
  setupqr();
  doqr(document.URL);

  /* Get static values once */
  ConstructPage();

  if ( statusautorefresh ) {
    refreshTimerId = setInterval( UpdateStatus , 10000 )
    clockId=setInterval(Tick,1000);
  }

});


