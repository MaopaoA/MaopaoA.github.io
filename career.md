---
layout: page
title: Career Progression
permalink: /career
---
<div class="section-page">
  <header class="section-header">
    <h1 class="section-page-title">Career Progression</h1>
    <p class="section-description">Posts related to research, study notes, and professional development.</p>
  </header>
  <ul class="section-post-list">
{% for post in site.posts %}
  {% if post.categories contains "career" %}
  <li class="section-post-item">
    <div class="section-post-header">
      <a href="{{ post.url }}" class="section-post-title">{{ post.title }}</a>
      <span class="section-post-date">{{ post.date | date: "%b %-d, %Y" }}</span>
    </div>
    {% assign post_content_raw = post.content | strip_html %}
    {% assign post_lines = post_content_raw | split: '
' %}
    {% assign skip_count = 0 %}
    {% assign excerpt_text = '' %}
    {% for line in post_lines %}
      {% assign line_stripped = line | strip %}
      {% if skip_count < 3 %}
        {% if line_stripped.size > 0 %}
          {% assign skip_count = skip_count | plus: 1 %}
        {% endif %}
      {% else %}
        {% if line_stripped.size > 0 %}
          {% assign excerpt_text = excerpt_text | append: line_stripped | append: ' ' %}
        {% endif %}
      {% endif %}
    {% endfor %}
    {% assign excerpt_text = excerpt_text | strip %}
    {% if excerpt_text.size > 0 %}
    <p class="section-post-excerpt">
      {{ excerpt_text | truncate: 100 }}
    </p>
    {% endif %}
  </li>
  {% endif %}
{% endfor %}
  </ul>
</div>
