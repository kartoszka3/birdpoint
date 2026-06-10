import React, { useState , useEffect} from 'react';

//////////////////////////////////
//BAZA WIEDZY////////////////////
/////////////////////////////////

//na prezentacji mozna powiedziec ze w ramach bazy wiedzy dalismy linki do materialow ktore uznalizmy za przydatne
//ale rozwijajac aplikacje chcielibysmy skonsultowac sie z ekspertami i rozbudowac ja o wlasne poradniki

export function SidebarBazaWiedzy({ links = [] }) {

  return (
    <div className="sidebar-pane knowledge-base">
      <h2>Baza wiedzy</h2>
      <p>Krótki wstęp a pod spodem linki do jakichś rzeczy bo zgaduję że nie będzie nam się chciało samodzielnie tego pisać</p>

      <div className="labels-container">
        {links.map(link => (
          <a 
            key={link.id} 
            href={link.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="kb-label"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}