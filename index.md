---
layout: userpage.njk
student: Aleksei Buvailik
course: "Exercises Art+Code SoSe 26"
exerciseGroup: 2
sections:
  - title: "Exercise 1 - Basics and Shapes"
    subsections:
      - title: Lines
        blocks:
          - type: gallery
            items:
              - src: exercise1/basic/base-portal.svg
                caption: lines 1
              - src: exercise1/basic/cone-portal.svg
                caption: lines 2
              - src: exercise1/basic/arch-portal.svg
                caption: lines 3
          - type: video
            src: exercise1/basic/screencast.mp4
          - type: code
            file: exercise1/basic/ex1_0.js
      - title: Shapes and grid
        blocks:
          - type: gallery
            items:
              - src: exercise1/shapes/order.svg
                caption: grid
              - src: exercise1/shapes/order_unorder.svg
                caption: grid + disorder
              - src: exercise1/shapes/rule_broken.svg
                caption: rule based grid + algorithmic disorder
          - type: code
            file: exercise1/shapes/ex1_0.js
  - title: "Exercise 2 - Design with functions"
    subsections:
      - title: Adapting
        blocks:
          - type: gallery
            items:
              - src: exercise2/adapting/lightningField.webp
                caption: Unknown Author
              - src: exercise2/adapting/line_field.jpg
                caption: Unknown Author
              - src: exercise2/adapting/sincos.jpg
                caption: Unknown Author
          - type: gallery
            items:
              - src: exercise2/adapting/bentField.svg
                caption: More randomness and more bent lines
              - src: exercise2/adapting/fieldSmooth.svg
                caption: Attempt to reproduce smooth line_field.jpg from Unknown Author
          - type: code
            file: exercise2/adapting/adapting.js
      - title: Selecting
        blocks:
          - type: gallery
            items:
              - src: exercise2/selecting/bentFieldSingularity.svg
                caption: Continuing the idea of bentField.svg and varying xAttractionShift = 52, a beautiful singularity effect emerges.
              - src: exercise2/selecting/bentFieldSingularity2.svg
                caption:  xAttractionShift = 54
              - src: exercise2/selecting/bentFieldSingularity3.svg
                caption: xAttractionShift = 55
---

<!-- SECTION: Final project -->