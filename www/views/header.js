define([
  'jquery',
  'underscore',
  'backbone',
  'models/settings',
  'models/subscription',
  'models/user',
  'collections/userAudit',
  'views/alert',
  'views/modalSettings',
  'views/modalSubscribe',
  'views/modalEnterprise',
  'views/modalFeedback',
  'views/modalAuditUser',
  'text!templates/header.html'
], function($, _, Backbone, SettingsModel, SubscriptionModel, UserModel,
    UserAuditCollection, AlertView, ModalSettingsView, ModalSubscribeView,
    ModalEnterpriseView, ModalFeedbackView, ModalAuditUserView,
    headerTemplate) {
  'use strict';
  var HeaderView = Backbone.View.extend({
    tagName: 'header',
    template: _.template(headerTemplate),
    events: {
      'click .enterprise-upgrade a, .enterprise-settings a': 'onEnterprise',
      'click .audit-admin a': 'onAuditAdmin',
      'click .change-password a': 'openSettings',
      'click .feedback': 'onFeedback'
    },
    initialize: function(options) {
      this.model = new SettingsModel();
      this.listenTo(window.events, 'settings_updated', this.update);
      this.update();
      HeaderView.__super__.initialize.call(this);
    },
    render: function() {
      this.$el.html(this.template());
      return this;
    },
    update: function() {
      this.model.fetch({
        success: function(model) {
          if (model.get('auditing') === 'all') {
            this.$('.audit-admin a').css('display', 'block');
          }
          else {
            this.$('.audit-admin a').hide();
          }
        }.bind(this),
        error: function() {
          var alertView = new AlertView({
            type: 'danger',
            message: 'Failed to load settings data, ' +
              'server error occurred.',
            dismissable: true
          });
          $('.alerts-container').append(alertView.render().el);
          this.addView(alertView);
        }.bind(this)
      });
    },
    onAuditAdmin: function() {
      var model = new UserModel();
      model.set({
        id: 'admin',
        organization: 'admin',
        name: 'Administrator'
      });
      var modal = new ModalAuditUserView({
        collection: new UserAuditCollection({
          'user': model
        })
      });
      this.addView(modal);
    },
    onEnterprise: function() {
      if (this.onEnterpriseLock) {
        return;
      }
      this.onEnterpriseLock = true;
      var model = new SubscriptionModel();
      model.fetch({
        success: function(model) {
          if (model.get('plan')) {
            this.enterpriseSettings(model);
          }
          else {
            this.enterpriseUpgrade();
          }
          this.onEnterpriseLock = false;
        }.bind(this),
        error: function() {
          var alertView = new AlertView({
            type: 'danger',
            message: 'Failed to load subscription information, ' +
              'server error occurred.',
            dismissable: true
          });
          $('.alerts-container').append(alertView.render().el);
          this.addView(alertView);
          this.onEnterpriseLock = false;
        }.bind(this)
      });
    },
    enterpriseUpgrade: function() {
      var modal = new ModalSubscribeView();
      this.listenToOnce(modal, 'applied', function() {
        var alertView = new AlertView({
          type: 'success',
          message: 'License activated.',
          dismissable: true
        });
        $('.alerts-container').append(alertView.render().el);
        this.addView(alertView);
      }.bind(this));
      this.addView(modal);
    },
    enterpriseSettings: function(model) {
      var modal = new ModalEnterpriseView({
        model: model
      });
      this.listenToOnce(modal, 'applied', function() {
        var alertView = new AlertView({
          type: 'danger',
          message: 'License removed.',
          dismissable: true
        });
        $('.alerts-container').append(alertView.render().el);
        this.addView(alertView);
      }.bind(this));
      this.addView(modal);
    },
    openSettings: function() {
      var model = new SettingsModel();
      model.fetch({
        success: function() {
          var modal = new ModalSettingsView({
            model: model
          });
          this.listenToOnce(modal, 'applied', function() {
            var alertView = new AlertView({
              type: 'success',
              message: 'Successfully saved settings.',
              dismissable: true
            });
            $('.alerts-container').append(alertView.render().el);
            this.addView(alertView);
          }.bind(this));
          this.addView(modal);
        }.bind(this),
        error: function() {
          var alertView = new AlertView({
            type: 'danger',
            message: 'Failed to load settings data, ' +
              'server error occurred.',
            dismissable: true
          });
          $('.alerts-container').append(alertView.render().el);
          this.addView(alertView);
        }.bind(this)
      });
    },
    onFeedback: function() {
      var modal = new ModalFeedbackView();
      this.listenToOnce(modal, 'applied', function() {
        var alertView = new AlertView({
          type: 'success',
          message: 'Successfully submitted feedback/bug report.',
          dismissable: true
        });
        $('.alerts-container').append(alertView.render().el);
        this.addView(alertView);
      }.bind(this));
      this.addView(modal);
    }
  });

  return HeaderView;
});
