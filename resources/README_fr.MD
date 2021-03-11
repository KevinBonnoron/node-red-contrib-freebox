# node-red-contrib-freebox

Ce package ajoute les noeuds pour faire des appels aux API de votre freebox.
La documentation des API de la freebox se trouve [ici](https://dev.freebox.fr/sdk/os/).

Noeuds inclus :
 - lan browser (appel /lan/browser/pub)
 - connection (appel /connection)
 - api (permet de faire un appel à n'importe quelle url avec le paramètre _msg.url_)

## Installation
```
cd ~/.node-red
npm install node-red-contrib-freebox
```

Lors de la première utilisation d'un des noeuds vous devrez ajouter une connection vers le serveur freebox. Une fois la configuration effectuée, la freeboxbox va demander l'autorisation de l'application. Vous aurez 30 secondes pour authoriser l'application. Passé ce délai une autre demande sera effectuée.

## Crédits
Basé sur :
- [ltoinel/node-red-contrib-freebox](https://github.com/ltoinel/node-red-contrib-freebox)
- [FrColin/node-red-contrib-freebox](https://github.com/FrColin/node-red-contrib-freebox)
- [zachowj/node-red-contrib-home-assistant-websocket](https://github.com/zachowj/node-red-contrib-home-assistant-websocket)
