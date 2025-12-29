---
layout: page
title: Literary Creation
permalink: /literature
---
<div class="section-page">
  <header class="section-header">
    <h1 class="section-page-title">Literary Creation</h1>
    <p class="section-description">Essays and more personal or creative pieces.</p>
  </header>
  
  <div class="literature-layout">
    <div class="literature-main">
      <h2 class="literature-subtitle">Novels & Essays</h2>
      <ul class="section-post-list">
        {% for post in site.posts %}
          {% if post.categories contains "literature" and post.path contains "/novel/" %}
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
    
    <aside class="literature-sidebar">
      <h2 class="literature-subtitle">Poetry</h2>
      <div class="poem-list">
        {% for post in site.posts %}
          {% if post.categories contains "literature" and post.path contains "/poem/" %}
          <article class="poem-card">
            <a href="{{ post.url }}" class="poem-title">{{ post.title }}</a>
            <span class="poem-date">{{ post.date | date: "%b %-d, %Y" }}</span>
            {% assign poem_content = post.content | strip_html | split: '
' %}
            {% assign poem_preview = '' %}
            {% assign line_count = 0 %}
            {% for line in poem_content %}
              {% assign line_stripped = line | strip %}
              {% if line_stripped.size > 0 and line_count < 6 %}
                {% assign poem_preview = poem_preview | append: line_stripped | append: '
' %}
                {% assign line_count = line_count | plus: 1 %}
              {% endif %}
            {% endfor %}
            {% if poem_preview.size > 0 %}
            <div class="poem-preview">
              {{ poem_preview }}
            </div>
            {% endif %}
          </article>
          {% endif %}
        {% endfor %}
      </div>
    </aside>
  </div>
</div>
