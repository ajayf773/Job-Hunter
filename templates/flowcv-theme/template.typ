#let project(
  name: "",
  title: "",
  email: "",
  phone: "",
  location: "",
  github: "",
  main: (),
  sidebar: (),
  ..args,
) = {
  set page(
    paper: "a4",
    margin: (x: 0mm, y: 0mm),
  )
  
  // Disable word hyphenation so words are never split with a hyphen across lines
  set text(
    font: ("Titillium Web", "Liberation Sans", "Roboto", "DejaVu Sans", "Arial"), 
    size: 9.2pt, 
    lang: "en",
    hyphenate: false,
  )
  
  set par(justify: false, leading: 0.55em)
  
  grid(
    columns: (38%, 62%),
    rows: (100%),
    // Left column: dark gray #313131
    rect(
      width: 100%,
      height: 100%,
      fill: rgb("#313131"),
      inset: (x: 8mm, y: 10mm),
      stroke: none,
      [
        #set text(fill: rgb("#ffffff"))
        
        // Name & Title in yellow #FFDD50
        #block(below: 1.2em)[
          #text(weight: "bold", size: 18pt, fill: rgb("#FFDD50"))[#name] \
          #v(4pt)
          #text(weight: "medium", size: 11pt, fill: rgb("#FFDD50"))[#title]
        ]
        
        // Contact details
        #block(below: 1.5em)[
          #set text(size: 8.5pt, fill: white)
          #if email != "" [#email \ ]
          #if phone != "" [#phone \ ]
          #if location != "" [#location \ ]
          #if github != "" [#github \ ]
        ]
        
        // Sidebar sections (Education, Technical Skills, Languages)
        #for sec in sidebar [
          #v(10pt)
          #text(weight: "bold", size: 10pt, fill: white)[#upper(sec.title)]
          #v(-4pt)
          #line(length: 25pt, stroke: 2.5pt + rgb("#FFDD50"))
          #v(4pt)
          #sec.content
        ]
      ]
    ),
    // Right column: white background
    rect(
      width: 100%,
      height: 100%,
      fill: white,
      inset: (x: 9mm, y: 10mm),
      stroke: none,
      [
        #set text(fill: rgb("#000000"))
        
        // Main sections (Professional Summary, Experience, Projects)
        #for sec in main [
          #v(8pt)
          #text(weight: "bold", size: 10pt, fill: black)[#upper(sec.title)]
          #v(-4pt)
          #line(length: 25pt, stroke: 2.5pt + rgb("#D78408"))
          #v(4pt)
          #sec.content
        ]
      ]
    )
  )
}
