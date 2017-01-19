#!/usr/bin/env coffee
debug              = require("debug")("tlc:formats")
fs                 = require "fs"
fileSitemap        = "#{__dirname}/../_site/sitemap.xml"
sitemap            = fs.readFileSync(fileSitemap, "utf8")

baseUrl = "https://transloadit.com"

additions = [
  "/login/"
  "/accounts/forgot_pw/"
]

removals = [
  "/jekyll.lanyon_assets.yml"
  "/denied/"
  "/unpublished/"
]

xmlAppend = ""
for addition in additions
  debug "Processing '#{baseUrl}#{addition}'"
  item      = ""
  item      = "#{item}<url>\n"
  item      = "#{item}<loc>#{baseUrl}#{addition}</loc>\n"
  item      = "#{item}<lastmod>2016-08-17T10:09:28+02:00</lastmod>\n"
  item      = "#{item}</url>\n"
  xmlAppend = "#{xmlAppend}#{item}"

xmlAppend = "#{xmlAppend}</urlset>"

sitemap = sitemap.replace('</urlset>', xmlAppend)

for removal in removals
  pattern = new RegExp("<url>\\s*<loc>\\s*#{baseUrl}#{removal}[^<]*</loc>\\s*</url>\\s*", "gmi")
  sitemap = sitemap.replace(pattern, "")

debug "Writing #{fileSitemap}"
fs.writeFileSync(fileSitemap, sitemap, "utf8")
