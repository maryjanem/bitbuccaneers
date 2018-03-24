

//.. normal val function will pick up placeholder. This won't
$.fn.valNotWatermark = function () {

    var $this = $(this),
        val = $this.eq(0).val();
    if (val == $this.attr('placeholder') || val == $this.attr('title'))
        return '';
    else
        return val;
}

