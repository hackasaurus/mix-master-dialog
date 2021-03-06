(function (jQuery) {
  var $ = jQuery;

  jQuery.setupUI = function(options) {
    var languages = options.languages || ["en"];
    var locale = jQuery.localization.createLocale(languages);

    $(document.body).localize(locale);

    var ui = {
      hud: jQuery.hudOverlay({
        defaultContent: options.defaultHudContent,
        locale: locale
      }),
      focusedOverlay: jQuery.focusedOverlay(),
      destroy: function() {
        this.focusedOverlay.destroy();
        this.focusedOverlay = null;
        this.hud.destroy();
        this.hud = null;
        this.editor.destroy();
        this.editor = null;
        this.skeleton.destroy();
        this.skeleton = null;
        this.rendering.destroy();
        this.rendering = null;
      }
    };
    var highlighter = jQuery.createHighlighter(ui.hud, ui.focusedOverlay);

    $(document.body).append(ui.hud.overlay);

    ui.rendering = new jQuery.HTMLRendering(options.rendering);
    
    ui.editor = new jQuery.Editor(
      options.idToEdit,
      options.defaultEditorContent,
      function onChange(text) {
        ui.rendering.setHTML(text);
        // TODO: Why does uncommenting this break things?
        //if (ui.skeleton)
        //  ui.skeleton.destroy();
        ui.skeleton = new jQuery.Skeleton(
          options.skeleton,
          options.rendering,
          highlighter
          );
      });

    return ui;
  };
  
  jQuery.setupMixMaster = function() {
    var isInIframe = !(top === self);

    var sendMessage;
    var responseSent = false;
    var isStarted = false;

    function onMessage(data) {
      if (isStarted)
        return;
      isStarted = true;
      var base = document.createElement('base');
      base.setAttribute('href', data.baseURI);
      $(document.head).append(base);
      $("#header h1").text(data.title);
      var editorHeight = $(window).height() / 2;
      $("#editor").height(editorHeight);
      $("#editor-container").height(editorHeight);      
      var ui = jQuery.setupUI({
        rendering: $("#rendering div.content"),
        skeleton: $("#skeleton div.content"),
        defaultHudContent: data.instructions,
        defaultEditorContent: data.startHTML,
        languages: data.languages,
        idToEdit: "editor"
      });
    }
    if (isInIframe) {
      window.addEventListener("message", function(event) {
        if (event.data && event.data.length && event.data[0] == '{') {
          onMessage(JSON.parse(event.data));
        }
      }, false);
      sendMessage = function sendMessageViaPostMessage(data) {
        window.parent.postMessage(JSON.stringify(data), "*");
      }
    } else {
      // We're developing this app in a window, so trigger the
      // dialog API calls with dummy data.
      onMessage({
        title: "Here is a title.",
        instructions: "Here are instructions.",
        startHTML: "<p>Here is starting HTML.</p>",
        baseURI: "http://www.mozilla.org/"
      });
      sendMessage = function fakeSendMessage(data) {
        alert("Sending the following to parent window: " +
              JSON.stringify(data));
      }
    }
    $("#nevermind.button").click(function() {
      if (!responseSent) {
        sendMessage({msg: 'nevermind'});
        responseSent = true;
      }
    });
    $("#ok.button").click(function() {
      if (!responseSent) {
        sendMessage({msg: 'ok', endHTML: $("pre#editor").text()});
        responseSent = true;
      }
    });
  }

})(jQuery);
