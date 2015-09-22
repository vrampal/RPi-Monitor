function ConstructPage()
{
  var activePage = GetURLParameter('activePage');

  if ( typeof activePage == 'undefined') {
    activePage=localStorage.getItem('activePage', activePage);
    if ( activePage == null ) { activePage = 0 }
  }
  data = getData('addons');
  if ( activePage >= data.length ){
    activePage=0;
  }
  localStorage.setItem('activePage', activePage);
  if ( data[activePage].showTitle != 0 ) {
    $('<h2 id="pagetitle"><p class="text-info">'+data[activePage].name+'</p><hr></h2>').insertBefore("#insertionPoint");
  }
  
  $("#insertionPoint").load("addons/"+data[activePage].addons+"/"+data[activePage].addons+".html")
  
  $("head").append("<link rel='stylesheet' type='text/css' href='addons/"+data[activePage].addons+"/"+data[activePage].addons+".css' />");
  
  jQuery.ajax({
      url: "addons/"+data[activePage].addons+"/"+data[activePage].addons+".js",
      dataType: "script",
    }).done(function() {
  });

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
});


