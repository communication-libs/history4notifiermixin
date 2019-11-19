function createServiceMixin (execlib) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry;

  var STATUS_DELIVERED = 3,
    STATUS_BOUNCED = 4;

  var SUBSTATUS_BOUNCED_PERMANENTLY = 10,
    SUBSTATUS_BOUNCED_TEMPORARILY = 11;

  function CommunicationHistoryNotifierServiceMixin (prophash) {
  }
  CommunicationHistoryNotifierServiceMixin.prototype.destroy = function () {
  };

  CommunicationHistoryNotifierServiceMixin.prototype.getCommunicationHistoryForSendingSystem = execSuite.dependentServiceMethod([], ['History'], function (historysink, sendingsystemcode, sendingsystemid, defer) {
    taskRegistry.run('readFromDataSink', {
      sink: historysink,
      filter: uniquefilterforsendingsystem(sendingsystemcode, sendingsystemid),
      singleshot: true,
      cb: defer.resolve.bind(defer),
      errorcb: defer.reject.bind(defer)
    });
  });

  CommunicationHistoryNotifierServiceMixin.prototype.updateCommunicationHistoryFromSendingSystem = execSuite.dependentServiceMethod([], ['History'], function (historysink, sendingsystemcode, sendingsystemid, updateobj, updateparams, defer) {
    qlib.promise2defer(
      historysink.call(
        'update',
        uniquefilterforsendingsystem(sendingsystemcode, sendingsystemid),
        updateobj,
        updateparams
      )
      ,
      defer
    );
  });
  
  CommunicationHistoryNotifierServiceMixin.prototype.markCommunicationHistoryAsDelivered = function (sendingsystemcode, sendingsystemid, sendingsystemnotified) {
    if (!lib.isNumber(sendingsystemnotified)) {
      return q.reject(new lib.Error('SENDINGSYSTEMNOTIFIED_NOT_A_NUMBER', 'sendingsystemnotified NaN: '+sendingsystemnotified));
    }
    return this.updateCommunicationHistoryFromSendingSystem(sendingsystemcode, sendingsystemid, {status: STATUS_DELIVERED, sendingsystemnotified: sendingsystemnotified}, {op:'set'});
  };

  CommunicationHistoryNotifierServiceMixin.prototype.markCommunicationHistoryAsBouncedPermanently = function (sendingsystemcode, sendingsystemid, sendingsystemnotified) {
    return this.updateCommunicationHistoryFromSendingSystem(sendingsystemcode, sendingsystemid, {status: STATUS_BOUNCED, substatus: SUBSTATUS_BOUNCED_PERMANENTLY, sendingsystemnotified: sendingsystemnotified}, {op:'set'});
  };

  CommunicationHistoryNotifierServiceMixin.prototype.markCommunicationHistoryAsBouncedTemporarily = function (sendingsystemcode, sendingsystemid, sendingsystemnotified) {
    return this.updateCommunicationHistoryFromSendingSystem(sendingsystemcode, sendingsystemid, {status: STATUS_BOUNCED, substatus: SUBSTATUS_BOUNCED_TEMPORARILY, sendingsystemnotified: sendingsystemnotified}, {op:'set'});
  };

  CommunicationHistoryNotifierServiceMixin.prototype.updateCommunicationHistoryForwardReferenceFromSendingSystem = function (sendingsystemcode, sendingsystemid, forwardreference) {
    return this.updateCommunicationHistoryFromSendingSystem(sendingsystemcode, sendingsystemid, {forwardreference: forwardreference}, {op:'set'});
  };

  CommunicationHistoryNotifierServiceMixin.addMethods = function (klass) {
    lib.inheritMethods(klass, CommunicationHistoryNotifierServiceMixin
      ,'getCommunicationHistoryForSendingSystem'
      ,'updateCommunicationHistoryFromSendingSystem'
      ,'markCommunicationHistoryAsDelivered'
      ,'markCommunicationHistoryAsBouncedPermanently'
      ,'markCommunicationHistoryAsBouncedTemporarily'
      ,'updateCommunicationHistoryForwardReferenceFromSendingSystem'
    );
  };


  function uniquefilterforsendingsystem (sendingsystemcode, sendingsystemid) {
    return {
      op: 'and',
      filters: [{
        op: 'eq',
        field: 'sendingsystem',
        value: sendingsystemcode
      },{
        op: 'eq',
        field: 'sendingsystemid',
        value: sendingsystemid
      }]
    };
  }

  return CommunicationHistoryNotifierServiceMixin;
}
module.exports = createServiceMixin;


