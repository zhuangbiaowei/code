# -*- coding: utf-8 -*-

import os
import Cookie
from base64 import b64encode
from datetime import timedelta


def randbytes2(bytes):
    return b64encode(os.urandom(bytes)).rstrip('=')


def get_site_cookie(environ, site):
    cookie = Cookie.SimpleCookie()
    if 'HTTP_COOKIE' in environ:
        cookie.load(environ['HTTP_COOKIE'])
        if site in cookie:
            return cookie[site].value


def format_rfc822_date(dt, localtime=True, cookie_format=False):
    if localtime:
        dt = dt - timedelta(hours=8)
    fmt = '%a, %d %b %Y %H:%M:%S GMT'
    if cookie_format:
        fmt = '%a, %d-%b-%Y %H:%M:%S GMT'
    return dt.strftime(fmt)


def format_cookie_date(dt, localtime=True):
    return format_rfc822_date(dt, localtime=True, cookie_format=True)
