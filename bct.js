if (jQuery !== 'undefined') {
    (function($) {
        jQuery('.trigger button').click(function() {
            jQuery('.headerlist ul.main-menu').toggle('100');
        });
        jQuery('.headerlist ul.main-menu>li.menu-item-has-children>a').click(function() {
            if (jQuery(this).parents('li').hasClass('onhover')) {
                return true;
            } else {
                jQuery('.headerlist ul.main-menu>li.onhover').removeClass('onhover');
                jQuery(this).parents('li').addClass('onhover');
                return false;
            }
        });
        $(document).ready(function() {
            function getUrlParam(name, url) {
                if (!url) url = location.href;
                name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
                var regexS = "[\\?&]" + name + "=([^&#]*)";
                var regex = new RegExp(regexS);
                var results = regex.exec(url);
                return results == null ? null : results[1];
            }

            function setCookie(key, value) {
                var expires = new Date();
                expires.setTime(expires.getTime() + (1 * 24 * 60 * 60 * 1000));
                document.cookie = key + '=' + value + ';expires=' + expires.toUTCString() + ";domain=.bec39.com;path=/";
            }

            function getCookie(key) {
                var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
                return keyValue ? keyValue[2] : null;
            }
            var phone = '';

            function getPhone() {
                var utm_source = getUrlParam('utm_source');
                var referrer = document.referrer;
                if (/^http[s]*:\/\/[w\.]*facebook\.com.*/.test(referrer) === true) utm_source = 'facebook';
                if (/^http[s]*:\/\/bec39\.pulscen\.ru.*/.test(referrer) === true) utm_source = 'pulscen';
                if (/^http[s]*:\/\/[w\.]*vk\.com.*/.test(referrer) === true) utm_source = 'vk';
                if (/http[s]*:\/\/[link]*\.2gis\.ru\/.*/.test(referrer) === true) utm_source = '2gis';
                console.log(referrer, 'referrer');
                if (utm_source == null || utm_source == 'undefined' || utm_source == '') {
                    if (/^http[s]*:\/\/[w\.]*google\.ru.*/.test(referrer) === true) utm_source = 'seo';
                    if (/^http[s]*:\/\/[w\.]*yandex\.ru.*/.test(referrer) === true) utm_source = 'seo';
                }
                switch (utm_source) {
                    case 'yandex':
                        phone = '74012519627';
                        setCookie('utm_phone', phone);
                        break;
                    case 'google':
                        phone = '74012920868';
                        setCookie('utm_phone', phone);
                        break;
                    case 'AvitoPromo':
                        phone = '74012658582';
                        setCookie('utm_phone', phone);
                        break;
                    case 'vk':
                        phone = '74012658526';
                        setCookie('utm_phone', phone);
                        break;
                    case 'facebook':
                        phone = '74012658245';
                        setCookie('utm_phone', phone);
                        break;
                    case 'pulscen':
                        phone = '74012920863';
                        setCookie('utm_phone', phone);
                        break;
                    case 'seo':
                        phone = '74012658243';
                        setCookie('utm_phone', phone);
                        break;
                    case '2gis':
                        phone = '74012658549';
                        setCookie('utm_phone', phone);
                        break;
                    default:
                        var cookieValue = getCookie('utm_phone');
                        phone = (cookieValue && cookieValue !== null && cookieValue !== 'undefined') ? cookieValue : '';
                        break;
                }
            }

            function getTransformedPhone(type, digits) {
                var result = digits;
                switch (type) {
                    case 0:
                        result = '+' + digits.slice(0, 1) + ' (' + digits.slice(1, 5) + ')' + digits.slice(5, 8) + '-' + digits.slice(8, 11);
                        break;
                    case 1:
                        result = '<small>+' + digits.slice(0, 1) + ' (' + digits.slice(1, 5) + ')</small>' + digits.slice(5, 8) + '-' + digits.slice(8, 11);
                        break;
                    default:
                        result = '+' + digits.slice(0, 1) + ' (' + digits.slice(1, 5) + ') ' + digits.slice(5, 7) + '-' + digits.slice(7, 9) + '-' + digits.slice(9, 11);
                        break;
                }
                return result;
            }
            getPhone();
            if (phone !== '') {
                console.log(phone, 'phone');
                var phone0 = getTransformedPhone(0, phone);
                var phone1 = getTransformedPhone(1, phone);
                var phone2 = getTransformedPhone(2, phone);
                $('a.phone').attr('href', 'tel:' + phone0);
                $('a.phone').html(phone1);
                $('a.phone1').attr('href', 'tel:' + phone0);
                $('a.phone1').html(phone1);
                var curHtml = $('.footer .city .textwidget').html();
                var newHtml = curHtml.replace(/^([^+]+)(\+[\d\s+()-]+)$/, "$1" + phone2);
                $('.footer .city .textwidget').html(newHtml);
                if ($('.rev_head').text() == 'Контакты') {
                    var firstReplaced = false;
                    $.each($('.default-page .row .detail-text p'), function(index, value) {
                        var pText = $(this).text();
                        if (/.*\+[\s]*[\(]*[\d]+[\)]*[\s\d-]+.*/.test(pText) === true && !firstReplaced) {
                            $(this).text(phone2);
                            firstReplaced = true;
                        }
                        if (/.*Адрес.*/.test(pText)) {
                            var curHtml = $(this).html();
                            var newHtml = curHtml.replace(/^([^+]+)(\+[^<]+)(.+)/, "$1" + phone2 + "$3");
                            $(this).html(newHtml);
                        }
                    });
                }
            }
        });
    })(jQuery);
}
