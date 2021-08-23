# node-red-contrib-freebox

Ce package ajoute les noeuds pour faire des appels aux API de votre freebox.
La documentation des API de la freebox se trouve [ici](https://dev.freebox.fr/sdk/os/).

Noeuds inclus :
 - ## [lan browser](/examples/nodes/fr/lan_browser.md) (appel /lan/browser/pub)
 - ## [connection](/examples/nodes/fr/connection.md) (appel /connection)
 - ## [api](/examples/nodes/fr/api.md) (permet de faire un appel à n'importe quel endpoint avec le _paramètre url_ **ou** _msg.url_)
 - ## [poll](/examples/nodes/fr/poll.md) (permet de faire un appel toutes les x millisecondes vers le endpoint avec le _paramètre url_ **ou** _msg.url_)

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
