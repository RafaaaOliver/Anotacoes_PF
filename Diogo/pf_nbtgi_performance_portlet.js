/**
 *@NApiVersion 2.x
 *@NScriptType Portlet
 *@author Daimom Diego de Souza Rosa
 */

define([
    'N/ui/serverWidget',
    'N/url',
    'N/https',
    'N/runtime',
    'N/log'
    ],
    function(ui, url, https, runtime, log) {
        function render(params) {

            var _portlet = params.portlet;
            var _customer = params.entity;

            var _script = 'customscript_pf_nbtgi_performance_ui_st';
            var _deployment = 'customdeploy_pf_nbtgi_performance_ui_st';

            var _suiteletURL = url.resolveScript({
                                    scriptId:_script,
                                    deploymentId: _deployment
                                });

            
            var _currentUser = runtime.getCurrentUser().id;
            var _url = [
                _suiteletURL,
                '&current_user=', _currentUser,
                '&customer=', _customer
            ].join('');

            _portlet.title = 'Performance Chart';
            var _content = ['<iframe frameBorder="0" style="width:100%; height:880px;"',
            'src="', _url,'">',
            '<p>Your browser does not support iframes.</p>',
            '</iframe>'].join('');

            params.portlet.html = _content;         
        }

        return {
            render: render
        };
    }
);