// App settings, change these to match your environment
var ONESIGNAL_APP_ID = "";
var GOOGLE_SENDER_ID = "";
var FORUM_URI        = "";

// Constants, don't change these
var FLARUM_TOKEN_KEY = "flarumToken";
var FLARUM_USERNAME_KEY = "flarumUsername";
var FLARUM_USER_ID_KEY = "flarumUserId";
var ONE_SIGNAL_TAG_KEY = "userId";

var app = {
  // Application Constructor
  initialize: function() {
    // DEBUG: Uncomment this to reset the local storage when the app is started
    //localStorage.clear();

    this.bindEvents();
  },
  // Bind Event Listeners
  //
  // Bind any events that are required on startup. Common events are:
  // 'load', 'deviceready', 'offline', and 'online'.
  bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },
  // deviceready Event Handler
  //
  // The scope of 'this' is the event. In order to call the 'receivedEvent'
  // function, we must explicitly call 'app.receivedEvent(...);'
  onDeviceReady: function() {
    app.initOneSignal();
  },

  initOneSignal: function() {
    var notificationOpenedCallback = function(jsonData) {
      console.log('Notification tapped: ' + JSON.stringify(jsonData));
      var url = jsonData.additionalData.url;

      if (url) {
        app.openUrl(url);
      }
    };

    // Register with OneSignal
    console.log('Registering with OneSignal');
    window.plugins.OneSignal.init(
      ONESIGNAL_APP_ID,
      {
        googleProjectNumber: GOOGLE_SENDER_ID,
      },
      notificationOpenedCallback
    );
    window.plugins.OneSignal.getIds(app.idsAvailable);
  },

  // Called when OneSignal is registered
  idsAvailable: function(ids) {
    console.log('Received OneSignal registration User ID: ' + ids.userId);

    if (localStorage.getItem(FLARUM_TOKEN_KEY) == null) {
      console.log('No flarum token, showing login form');
      app.showLoginForm();
    } else {
      app.showUserInfo();
      app.registerDevice();
    }
  },

  // Update DOM to show login form
  showLoginForm: function() {
    var form = document.getElementById('loginForm');
    form.setAttribute('style', 'display: block');

    // Handler for submit button - cleanup in case it was added before
    form.removeEventListener("submit", app.submitLoginForm);
    form.addEventListener("submit", app.submitLoginForm);

    // Reset fields
    form.username.value = '';
    form.password.value = '';
    form.submit.disabled = '';
    form.submit.value = 'Login';

    form.username.focus();
  },

  // Update DOM to hide login form
  hideLoginForm: function() {
    var form = document.getElementById('loginForm');
    form.setAttribute('style', 'display: none');
  },

  // Update DOM to show user info
  showUserInfo: function() {
    var div = document.getElementById('userInfo');
    div.setAttribute('style', 'display: block');

    // Show username
    var userId = div.getElementsByClassName('userId')[0];
    userId.innerText = localStorage.getItem(FLARUM_USERNAME_KEY);

    // Handler for logout button - cleanup in case it was added before
    var btnLogout = div.getElementsByClassName('btn-logout')[0];
    btnLogout.removeEventListener("click", app.logout);
    btnLogout.addEventListener("click", app.logout);
  },

  // Update DOM to hide user info
  hideUserInfo: function() {
    var div = document.getElementById('userInfo');
    div.setAttribute('style', 'display: none');
  },

  submitLoginForm: function(ev) {
    console.log('Submitting login form')

    ev.preventDefault();

    var form = document.getElementById('loginForm');

    var username = form.username.value;
    var password = form.password.value;

    form.submit.disabled = 'disabled';
    form.submit.value = 'Loading...';

    window.cordovaHTTP.post(
      FORUM_URI + '/api/token',
      {
        identification: username,
        password:       password
      },
      {},
      // Success
      function(response) {
        var data = JSON.parse(response.data);
        var token = data.token;
        var userId = data.userId;

        console.log('Login successful - Got token: ' + token);

        localStorage.setItem(FLARUM_TOKEN_KEY, token);
        localStorage.setItem(FLARUM_USERNAME_KEY, username);
        localStorage.setItem(FLARUM_USER_ID_KEY, userId);

        app.hideLoginForm();
        app.showUserInfo();
        app.registerDevice();
      },
      // Failure
      function(response) {
        console.log('Login request failure - Status: ' + response.status + ' Data: ' + response.data);
        app.showLoginForm();
        alert('Invalid login, please try again!');
      }
    );

    return false;
  },

  logout: function(ev) {
    console.log('Logging out')

    ev.preventDefault();

    app.unregisterDevice();

    localStorage.removeItem(FLARUM_TOKEN_KEY);
    localStorage.removeItem(FLARUM_USERNAME_KEY);
    localStorage.removeItem(FLARUM_USER_ID_KEY);

    app.hideUserInfo();
    app.showLoginForm();

    return false;
  },

  registerDevice: function() {
    console.log('Registering device');

    var userId = localStorage.getItem(FLARUM_USER_ID_KEY);

    if (userId == null) {
      console.error("Got null Flarum userId");
      return;
    }

    window.plugins.OneSignal.sendTag(ONE_SIGNAL_TAG_KEY, userId);
  },

  unregisterDevice: function() {
    console.log('Unregistering device');

    window.plugins.OneSignal.deleteTag(ONE_SIGNAL_TAG_KEY);
  },

  openUrl: function(url) {
    console.log('Opening url: ' + url);
    window.open(url, '_system');
  }
};
