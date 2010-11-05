// Xml references
var content; 
var tutorial;
// Bib is the available references
var bib=new Array();
// Appbib is the applied references
appbib=new Array();
// Location of content and tutorial xml
var content_url="content.xml";
var tutorial_url="tutorial.xml";
// First section label to make life easier
var flab;
// Expanded/collapsed characters
//var expchar='&#8944; '; var cochar='&#8945 '; 
//expchar='*'; cochar=' ';
var expchar='&#045;&#032'; var cochar='&#043;&#032';


function start()
{
	 // Check url for curl
	 // Load content.xml into content
	 $.ajax({ type: "GET", url: content_url, dataType: "xml", success: function(xml) {
				content=xml;
				procmenu();
				procbib();
				}});
	 $('#hal-content').slideToggle('fast');
	 $('#hal a:first').click(function(){
				$('#hal-content').slideToggle('fast').toggleClass('present');
				this.blur()
				return false;
				});
}

function procmenu()
{
	 $.ajax({ type: "GET", url: tutorial_url, dataType: "xml", success: function(xml) {
		  var version=$($(xml).find('tutorial')[0]).attr('version');
		  $('#version').text(version);
		  // Initialized menu
		  $('#menu').html('');
		  var menu=$('<ul>');
		  // Process each category
		  $(xml).find('category').each(function(){
				var cat=$('<li>');
				// Category heading
				var cat_title=$(this).attr('title');
				// Generate menu item for category
				var cat_link=$('<a href="#" class="catlink">')
					 .html(expchar+cat_title)
					 .click(function(){
						  // Collapse category menu
						  $(this).toggleClass('collapsed').find('+ul').slideToggle('fast');
						  // Get correct character
						  var tmpchar=expchar;
						  if ($(this).hasClass('collapsed')) {
								tmpchar=cochar;
								$(this).css('color','#aaa');
						  } else {
								$(this).css('color','');
						  }
						  // Swap cochar/expchar
						  $(this).html(tmpchar+$(this).html().substr(1));
						  // Hide those damned outlines
						  this.blur();
						  // Stop browser from trying to do something with the link
						  return false;
					 })
					 .appendTo(cat);
				// Initialize chapter menu
				var cat_menu=$('<ul>');
				// Check if the cat references an existing category
				if ($(this).find('include').length)
				{
					 // tmp stores the name of the referenced category
					 var tmp=$($(this).find('include')[0]).text();
					 $(content)
						  .find('category[label=\''+tmp+'\']')
						  .find('chapter')
						  .each(function(){
								$(cat_menu).append(procmchapter(this));
						  });
				}
				else
				{
					 $(this).find('chapter').each(function(){
						  $(cat_menu).append(procmchapter(this));
					 });
				}
				cat.append(cat_menu);
				menu.append(cat);
		  });
		  $('#menu').append(menu);
		  var curl=location.href.split('label=')[1];
		  procsub(curl);
		  postprocmenu(curl);
	 }});
}

function procmchapter(X)
{
	 var chap=$('<li>');
	 // Chapter title
	 var chap_title=$(X).attr('title');
	 // Chapter link
	 var chap_link=$('<a href="#" class="chaplink">')
		  .html(expchar+chap_title)
		  .click(function(){
				// Toggle
				$(this).toggleClass('collapsed').find('+ul').slideToggle('fast');
				var tmpchar=expchar;
				if ($(this).hasClass('collapsed')) tmpchar=cochar;
				$(this).html(tmpchar+$(this).html().substr(1));
				this.blur();
				return false;
		  })
		  .appendTo(chap);
	 var chap_menu=$('<ul>');
	 if ($(X).find('include').length)
	 {
		  var tmp=$($(this).find('include')[0]).text();
		  tmp=$(content).find('chapter[label=\''+tmp+'\']')[0];
		  $(tmp).find('section').each(function(){
				$(chap_menu).append(procmsection(this));
		  });
	 }
	 else
	 {
		  $(X).find('section').each(function(){
				tmp=$(this).attr('ref');
				if (tmp)	{
					 tmp=$(content).find('section[label=\''+tmp+'\']')[0];
					 if (tmp) $(chap_menu).append(procmsection(tmp));
				} else {
					 $(chap_menu).append(procmsection(this));
				}
		  });
	 }
	 $(chap).append(chap_menu);
	 return chap;
}

function procmsection(X)
{
	 var sect_title=$(X).attr('title');
	 var sect_label=$(X).attr('label');
	 // Set flab, could be made smarter?
	 if (!flab) flab=sect_label;
	 var tmp=$('<li>');
	 var sect_link=$('<a class="sectlink">')
		  .attr('href','#label='+sect_label)
		  .text(sect_title)
		  .click(function(){
				curl=$(this).attr('href').split('label=')[1];
				procsub(curl);
				this.blur();
		  })
		  .appendTo(tmp)
	 return tmp;
}

function postprocmenu(curl)
{
	 if (!curl) curl=flab;
	 $('#menu').find('ul > li > ul').each(function(){
		  if ($(this).html().indexOf('#label='+curl) < 0) {
				$(this).slideToggle("fast");
				tmp=$(this).parent().find('a')[0];
				$(tmp).toggleClass('collapsed');
		  }
	 });
	 $('#menu').find('ul>li>ul').each(function(){
		  tmp=$(this).parent().find('a')[0];
		  if ($(tmp).hasClass('collapsed')){
				if (tmp.className.indexOf('catlink') > -1) $(tmp).css('color','#aaa');
				$(tmp).html(cochar+$(tmp).html().substr(1));
		  }
	 });
}

function procsub(curl)
{
	 // Clear appbib
	 appbib=new Array();
	 $('#content').html('');
	 var div=$('<div class="section">');
	 var subcontent=$('<div>');
	 // If curl is empty, load the first section in tutorial
	 if (!curl)
	 {
		  curl=flab;
	 }
	 // If curl is not a valid label
	 if (!$(content).find('section[label='+curl+']').length)
	 {
		  curl=flab;
	 }
	 var sub=$(content).find('section[label='+curl+']').first();
	 var title=$(sub).attr('title');
	 var header=$('<h2>').text(title);
	 var deps=$('<div class="deps">You should be familiar with </div>');
	 var hasDeps=false;
	 $(sub).find('dependency').each(function(){
				hasDeps=true;
				var tmpdep=$(this).text() + ' ';
				$('<a>').attr('href','#')
					.text(tmpdep)
					.click(function(){
							hal($(this).text());
							this.blur();
							return false;
							})
					.appendTo(deps);
				$('<span>').text(' ').appendTo(deps);
				});
	 $(sub).contents().each(function(){
				subcontent.append(subproc(this));
				});
	 div.append(header)
	 if (hasDeps) div.append(deps);
	 div.append(subcontent);
	 $('#content').append(div);
	 postprocbib();
	
	 // Convert Latex to MathML  
	 AMtranslated=false;
	 translate();
	 
	 // Add spacer at bottom for hal
	 $('<div id="spacer" />').appendTo('#content');
}


function procbib()
{
	 $(content).find('bibliography').children().each(function(){
				tmplabel=$(this).attr('label');
				bib[tmplabel]=$(this).text();
				});
}

function postprocbib()
{
	 // Post-process bibliography
	 var hasBib=false;
	 var bibdiv=$('<div id="bibliography">').html('<h2>Bibliography</h2>');
	 for (ref in appbib)
	 {
		  hasBib=true;
		  var tmpcite=bib[appbib[ref]];
		  // Process links inside references
		  var tmparray=tmpcite.split(' ');
		  for (j in tmparray)
		  {
				var tmp=tmparray[j];
				if (tmp.indexOf('http') > -1)
				{
					 tmplink=$('<a>').text(tmp).attr('href',tmp).attr('target','_new');
					 tmparray[j]=$('<div>').append(tmplink).html();
				}
		  }
		  tmpcite=tmparray.join(' ');
		  $('<div class="bibitem">').html('['+eval(ref+1)+'] '+tmpcite).appendTo(bibdiv);
	 }
	 // If any bibitems, then append bib
	 if (hasBib) $('#content').append(bibdiv);
}

function subproc(node)
{
	 var tmp;
	 if(node.tagName=="link")
	 {
		  tmp=$('<a/>')
				.attr('href',$(node).attr('url'))
				.attr('target','_new')
				.text($(node).text());
	 } 
	 else if (node.tagName=="verbatim") 
	 {
		  tmp=$('<pre>').text($(node).text());
	 }
	 else if (node.tagName=="code")
	 {
		  tmp=$('<code/>').text($(node).text());
	 }
	 else if (node.tagName=="exercise")
	 {
		  header=$('<h4>').text('Exercise:');
		  tmp=$('<div class="exercise"/>')
				.append(header);
		  tmp.html(tmp.html()+$(node).text());
	 }
	 else if (node.tagName=="ref")
	 {
		  var tmpref=$(node).text();
		  appbib.push(tmpref);
		  var i=appbib.length;
		  tmp='['+i+']';
	 }
	 else if (node.tagName=="image")
	 {
		  tmp=$('<img/>')
				.attr('src', $(node).attr('src'))
				.attr('alt', $(node).attr('alt'))
				.attr('height',$(node).attr('height'))
				.attr('width',$(node).attr('width'));
	 }
	 else if (node.tagName=="dependency")	 
	 {
		  tmp=false;
	 }
	 else if (node.tagName=="list")
	 {
		  tmp = $('<ul>');
		  $(node).children().each(function(){
			   tmp.append(subproc(this));
		  });
	 }
	 else if (node.tagName=="enumeration")
	 {
		  tmp = $('<ol>');
		  $(node).children().each(function(){
			   tmp.append(subproc(this));
		  });
	 }
	 else if (node.tagName=="item")
	 {
		  tmp = $('<li>');
		  $(node).contents().each(function(){
			   tmp.append(subproc(this)); 
		  });
	 }
	 else if (node.tagName=="subsection")
	 {
		  tmp = $('<div class="subsection">');

		  var header = $('<h3>').text($(node).attr('title')); 
		  var body = $('<div class="text">');
		  
		  $(node).contents().each(function(){
			   body.append(subproc(this));
		  });

		  tmp.append(header);
		  tmp.append(body);
	 }
	 else if (node.tagName=="subsubsection")
	 {
		  tmp = $('<div class="subsubsection">');

		  var header = $('<h4>').text($(node).attr('title')); 
		  var body = $('<div class="text">');
		  
		  $(node).contents().each(function(){
			   body.append(subproc(this));
		  });

		  tmp.append(header);
		  tmp.append(body);
	 }
	 else 
	 {
		  tmp=$('<span>');
		  var str=$(node).text();
		  while (str.indexOf('\\\\') > -1)
		  {		
				str=str.replace('\\\\','<br />');
		  }
		  tmp.html(str);

	 }
	 return tmp;
}

function hal(label)
{
	 var HAL=$('#hal');
	 var HALC=$('#hal-content');
	 HALC.text('Loading...');
	 if (!HALC.hasClass('present'))
	 {
		  HALC.slideToggle('fast').toggleClass('present');
	 }
	 $.ajax({ type: "GET", url: content_url, dataType: "xml", success: function(xml) {
				$(xml).find('section[label='+label+']').each(function()
					 {
					 title=$(this).attr('title');
					 $('#hal-title').text(title);
					 $(this).contents().each(function() {
						  if (this.tagName != 'verbatim') $(this).remove();
						  });
					 var halcontent=$('<div>');
					 $(this).contents().each(function(){
						  halcontent.append(subproc(this));
						  });
					 HALC.html(halcontent);
					 //$('#hal-content *:first').before(($('<h3>').text(title)));
					 });

					AMtranslated=false;
					translate();
				}
		});
}
