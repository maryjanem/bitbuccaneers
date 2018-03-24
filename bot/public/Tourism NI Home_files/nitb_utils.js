

$(document).ready(function () {

    $('.functional-hide').hide();

    $('.function-toggle-link').click(function () {
        var panelID = $(this).data('panel-toggle');
        $('#' + panelID).toggle();
        return false;
    });

    $('.functional-toggle-tabs').each(function () {

        var selector = $(this).data('tabs');
        //$('.' + selector).hide();
        //$('.' + selector).first().show();

        $('.' + selector).addClass('visually-hidden');
        $('.' + selector).first().removeClass('visually-hidden');


    });

    $('.functional-toggle-tabs li a').click(function () {

        var tabContainer = $(this).closest('.functional-toggle-tabs');
        var tabSelectorAll = tabContainer.data('tabs');
        var selectedCss = tabContainer.data('tabs-selected-css');
        var tabSelectorTarget = $(this).data('tabs-target');

        
        $('.' + tabSelectorAll).addClass('visually-hidden');
        $('#' + tabSelectorTarget).removeClass('visually-hidden');
        
        $(tabContainer).find('li').removeClass(selectedCss);
        $(this).closest('li').addClass(selectedCss);

        if ($(this).hasClass('functional-map-initialiser')) {
            if (initializeResultsMap != null) {
                initializeResultsMap();
            }
        }
        
        var customFunction = $(this).data('tabs-custom-function');
        if (customFunction != null) {
            window[customFunction](this);
        }
        return false;
    });

    $('.functional-tabs-click-trigger').click(function () {
       
        var menuId = $(this).data('tabs-menu-id');
        var menuItemId = $(this).data('tabs-menu-item-id');

        $('#' + menuId + ' #' + menuItemId).trigger('click');
        window.scrollTo(0, 0);
        return false;

    });

    //.. ensure footer is selected if it has been clicked
    var thisPage = GetPageFromUrl(document.URL);
    $('footer a').removeClass('active')
                 .filter(function () {
                        return GetPageFromUrl($(this).prop('href')) == thisPage;
                 })
                 .addClass('active');

});

function facilitesShow(element) {
    facilitesToggle(element, true);
}

function facilitesHide(element) {
    facilitesToggle(element, false);
}

//.. custom functions for tab toggling
function facilitesToggle(element, show) {

    var tabContainer = $(element).closest('.functional-toggle-tabs');
    var tabSelectorAll = '.' + tabContainer.data('tabs');
    if (show) {
        $(tabSelectorAll).find('#facilitySubPanel').removeClass('visually-hidden');
        $(tabSelectorAll).find('#generalInfoSubPanel').addClass('visually-hidden');
    }
    else {
        $(tabSelectorAll).find('#facilitySubPanel').addClass('visually-hidden');
        $(tabSelectorAll).find('#generalInfoSubPanel').removeClass('visually-hidden');
    }
}

//.. returns last part of url i.e. the page
//.. can work with trailing / characters in URL
function GetPageFromUrl(url) {

    //var $url = $(this);
    parts = url.split('/'),
    lastPart = parts.pop() == '' ? parts[parts.length - 1] : parts.pop();
    return lastPart;
}