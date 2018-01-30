node module for:
http://code.google.com/p/google-diff-match-patch/ by Neil Fraser and contributors.

drop in the original code form svn of Neil Fraser's diff_match_patch.
uses jsinc and a simple index.js file and thus it is easily updatable

to update just copy in here the 'demos' and 'javascript' folders

this module is also awesome because you can use exactrly the same code on the serverside 
and on the client side.

this module is built using https://github.com/shimondoodkin/jsinc

the test tests just that the modue is usable.

see demos to learn how it works.

by Shimon Dookdin

may be intalled with npm:

    npm install googlediff

demo:
    var diff_match_patch=require('googlediff');
    
    var dmp =new diff_match_patch();
    function launch() {
      var text1 = "this is some test. blah blah blah";
      var text2 = "this is other text. blah blah blah";
      //dmp.Diff_Timeout = 1; // set 0 for no timeout
    
      var ms_start = (new Date()).getTime();
      var d = dmp.diff_main(text1, text2);
      var ms_end = (new Date()).getTime();
    
      if (true) {
        dmp.diff_cleanupSemantic(d);
      }
      if (false) {
        dmp.Diff_EditCost = 4;
        dmp.diff_cleanupEfficiency(d);
      }
      //var ds = dmp.diff_prettyHtml(d);
      //console.log(ds + '<br/>Time: ' + (ms_end - ms_start) / 1000 + 's');
      console.log(d)
    }
    launch()

output:
    [ [ 0, 'this is ' ],
      [ -1, 'some' ],
      [ 1, 'other' ],
      [ 0, ' te' ],
      [ -1, 's' ],
      [ 1, 'x' ],
      [ 0, 't. blah blah blah' ] ]
