document.addEventListener('DOMContentLoaded', () => {
  const userGrid = document.querySelector('.grid-user')
  const computerGrid = document.querySelector('.grid-computer')
  const displayGrid = document.querySelector('.grid-display')
  const ships = document.querySelectorAll('.ship, .mine')
  //const mines = document.querySelectorAll('.mine')
  const destroyer = document.querySelector('.destroyer-container')
  const destroyer2 = document.querySelector('.destroyer2-container')
  const submarine = document.querySelector('.submarine-container')
  const cruiser = document.querySelector('.cruiser-container')
  const battleship = document.querySelector('.battleship-container')
  const carrier = document.querySelector('.carrier-container')
  const mine1 = document.querySelector('.mine1-container')
  const mine2 = document.querySelector('.mine2-container')
  const mine3 = document.querySelector('.mine3-container')
  const mine4 = document.querySelector('.mine4-container')
  const xBomberButton = document.querySelector('#xBomber')
  const tBomberButton = document.querySelector('#tBomber')
  const startButton = document.querySelector('#start')
  const rotateButton = document.querySelector('#rotate')
  const turnDisplay = document.querySelector('#whose-go')
  const infoDisplay = document.querySelector('#info')
  const setupButtons = document.getElementById('setup-buttons')
  const userSquares = []
  const userSquaresSelected = []
  const computerSquares = []
  let isHorizontal = true
  let isGameOver = false
  let currentPlayer = 'user'
  const width = 10
  let playerNum = 0
  let ready = false
  let enemyReady = false
  let allShipsPlaced = false
  let shotFired = -1
  let xBomberOn = false
  let tBomberOn = false
  let xBomberUsed = false
  let tBomberUsed = false
  //Selected Board
  for (let i=0; i <100; i++) {
    userSquaresSelected[i] = false
  }
  //Ships
  const shipArray = [
    {
      name: 'mine1',
      directions: [
        [0],
        [0]
      ]
    },
    {
      name: 'mine2',
      directions: [
        [0],
        [0]
      ]
    },
    {
      name: 'mine3',
      directions: [
        [0],
        [0]
      ]
    },
    {
      name: 'mine4',
      directions: [
        [0],
        [0]
      ]
    },
    {
      name: 'destroyer',
      directions: [
        [0, 1],
        [0, width]
      ]
    },
    {
        name: 'destroyer2',
        directions: [
            [0, 1],
            [0, width]
        ]

    },
    {
      name: 'submarine',
      directions: [
        [0, 1, 2],
        [0, width, width*2]
      ]
    },
    {
      name: 'cruiser',
      directions: [
        [0, 1, 2],
        [0, width, width*2]
      ]
    },
    {
      name: 'battleship',
      directions: [
        [0, 1, 2, 3],
        [0, width, width*2, width*3]
      ]
    },
    {
      name: 'carrier',
      directions: [
        [0, 1, 2, 3, 4],
        [0, width, width*2, width*3, width*4]
      ]
    },
  ]

  createBoard(userGrid, userSquares)
  createBoard(computerGrid, computerSquares)

  // Select Player Mode
  if (gameMode === 'singlePlayer') {
    startSinglePlayer()
  } else {
    startMultiPlayer()
  }

  // Multiplayer
  function startMultiPlayer() {
    const socket = io();

    // Get your player number
    socket.on('player-number', num => {
      if (num === -1) {
        infoDisplay.innerHTML = "Sorry, the server is full"
      } else {
        playerNum = parseInt(num)
        if(playerNum === 1) currentPlayer = "enemy"

        console.log(playerNum)

        // Get other player status
        socket.emit('check-players')
      }
    })

    // Another player has connected or disconnected
    socket.on('player-connection', num => {
      console.log(`Player number ${num} has connected or disconnected`)
      playerConnectedOrDisconnected(num)
    })

    // On enemy ready
    socket.on('enemy-ready', num => {
      enemyReady = true
      playerReady(num)
      if (ready) {
        playGameMulti(socket)
        setupButtons.style.display = 'none'
      }
    })

    // Check player status
    socket.on('check-players', players => {
      players.forEach((p, i) => {
        if(p.connected) playerConnectedOrDisconnected(i)
        if(p.ready) {
          playerReady(i)
          if(i !== playerReady) enemyReady = true
        }
      })
    })

    // On Timeout
    socket.on('timeout', () => {
      infoDisplay.innerHTML = 'You have reached the 10 minute limit'
    })

    // Ready button click
    startButton.addEventListener('click', () => {
      if(allShipsPlaced) playGameMulti(socket)
      else infoDisplay.innerHTML = "Please place all ships"
    })

    // Setup event listeners for firing
    computerSquares.forEach(square => {
      square.addEventListener('click', () => {
        if(currentPlayer === 'user' && ready && enemyReady) {
          shotFired = square.dataset.id
          socket.emit('fire', shotFired)
        }
      })
    })

    // On Fire Received
    socket.on('fire', id => {
      enemyGo(id)
      const square = userSquares[id]
      socket.emit('fire-reply', square.classList)
      playGameMulti(socket)
    })

    // On Fire Reply Received
    socket.on('fire-reply', classList => {
      revealSquare(classList)
      playGameMulti(socket)
    })

    function playerConnectedOrDisconnected(num) {
      let player = `.p${parseInt(num) + 1}`
      document.querySelector(`${player} .connected`).classList.toggle('active')
      if(parseInt(num) === playerNum) document.querySelector(player).style.fontWeight = 'bold'
    }
  }

  // Single Player
  function startSinglePlayer() {
    generate(shipArray[0])
    generate(shipArray[1])
    generate(shipArray[2])
    generate(shipArray[3])
    generate(shipArray[4])
    generate(shipArray[5])
    generate(shipArray[6])
    generate(shipArray[7])
    generate(shipArray[8])
    generate(shipArray[9])

    startButton.addEventListener('click', () => {
      if (allShipsPlaced) {
        setupButtons.style.display = 'none'
        playGameSingle()
      }
    })
    xBomberButton.addEventListener('click', () => {
        if (allShipsPlaced && !xBomberUsed){
            infoDisplay.innerHTML = "Please pick center hit"
            console.log("xbomber button")
            xBomberOn = true
            xBomberUsed = true
        }
    })
    tBomberButton.addEventListener('click', () => {
        if (allShipsPlaced && !tBomberUsed) {
            infoDisplay.innerHTML = "please pick center hit"
            console.log("tbomber button")
            tBomberOn = true
            tBomberUsed = true
        }
    })
  }

  //Create Board
  function createBoard(grid, squares) {
    for (let i = 0; i < width*width; i++) {
      const square = document.createElement('div')
      square.dataset.id = i
      grid.appendChild(square)
      squares.push(square)
    }
  }

  //Draw the computers ships in random locations
  function generate(ship) {
    let randomDirection = Math.floor(Math.random() * ship.directions.length)
    let current = ship.directions[randomDirection]
    if (randomDirection === 0) direction = 1
    if (randomDirection === 1) direction = 10
    let randomStart = Math.abs(Math.floor(Math.random() * computerSquares.length - (ship.directions[0].length * direction)))

    const isTaken = current.some(index => computerSquares[randomStart + index].classList.contains('taken'))
    const isAtRightEdge = current.some(index => (randomStart + index) % width === width - 1)
    const isAtLeftEdge = current.some(index => (randomStart + index) % width === 0)
    
    //console.log(ship.name + "\n")
    //if (ship.name != 'mine1' && ship.name != 'mine2' && ship.name != 'mine3' && ship.name != 'mine4') {
        if (!isTaken && !isAtRightEdge && !isAtLeftEdge) {
            current.forEach(index => computerSquares[randomStart + index].classList.add('taken', ship.name))
      //      console.log("taken\n")
        }
    //}
    //else if (!isTaken && !isAtRightEdge && !isAtLeftEdge) {
      //  current.forEach(index => computerSquares[randomStart + index].classList.add('takenM', ship.name))
        //console.log("takenM\n")
    //}
    
    else generate(ship)
  }
  

  //Rotate the ships
  function rotate() {
    if (isHorizontal) {
      destroyer2.classList.toggle('destroyer2-container-vertical')
      destroyer.classList.toggle('destroyer-container-vertical')
      submarine.classList.toggle('submarine-container-vertical')
      cruiser.classList.toggle('cruiser-container-vertical')
      battleship.classList.toggle('battleship-container-vertical')
      carrier.classList.toggle('carrier-container-vertical')
      isHorizontal = false
      // console.log(isHorizontal)
      return
    }
    if (!isHorizontal) {
      destroyer2.classList.toggle('destroyer2-container-vertical')
      destroyer.classList.toggle('destroyer-container-vertical')
      submarine.classList.toggle('submarine-container-vertical')
      cruiser.classList.toggle('cruiser-container-vertical')
      battleship.classList.toggle('battleship-container-vertical')
      carrier.classList.toggle('carrier-container-vertical')
      isHorizontal = true
      // console.log(isHorizontal)
      return
    }
  }
  rotateButton.addEventListener('click', rotate)

  //move around user ship
  ships.forEach(ship => ship.addEventListener('dragstart', dragStart))
  //mines.forEach(mine => mine.addEventListener('dragstart', dragStart))
  userSquares.forEach(square => square.addEventListener('dragstart', dragStart))
  userSquares.forEach(square => square.addEventListener('dragover', dragOver))
  userSquares.forEach(square => square.addEventListener('dragenter', dragEnter))
  userSquares.forEach(square => square.addEventListener('dragleave', dragLeave))
  userSquares.forEach(square => square.addEventListener('drop', dragDrop))
  userSquares.forEach(square => square.addEventListener('dragend', dragEnd))

  let selectedShipNameWithIndex
  let draggedShip
  let draggedShipLength
  //let selectedMineNameWithIndex
  //let draggedMine

  ships.forEach(ship => ship.addEventListener('mousedown', (e) => {
    selectedShipNameWithIndex = e.target.id
    // console.log(selectedShipNameWithIndex)
  }))

  /*mines.forEach(mine => mine.addEventListener('mousedown', (e) => {
    selectedMineNameWithIndex = e.target.id
  }))*/

  function dragStart() {
    draggedShip = this
    draggedShipLength = this.childNodes.length
    // console.log(draggedShip)
  }

  function dragOver(e) {
    e.preventDefault()
  }

  function dragEnter(e) {
    e.preventDefault()
  }

  function dragLeave() {
    // console.log('drag leave')
  }

  function dragDrop() {
    console.log(draggedShip.lastChild.id)
    let shipNameWithLastId = draggedShip.lastChild.id
    //console.log(shipNameWithLastId)
    let shipClass = shipNameWithLastId.slice(0, -2)
    //console.log(shipClass + "\n")
    let lastShipIndex = parseInt(shipNameWithLastId.substr(-1))
    let shipLastId = lastShipIndex + parseInt(this.dataset.id)
    // console.log(shipLastId)
    const notAllowedHorizontal = [0,10,20,30,40,50,60,70,80,90,1,11,21,31,41,51,61,71,81,91,2,22,32,42,52,62,72,82,92,3,13,23,33,43,53,63,73,83,93]
    const notAllowedVertical = [99,98,97,96,95,94,93,92,91,90,89,88,87,86,85,84,83,82,81,80,79,78,77,76,75,74,73,72,71,70,69,68,67,66,65,64,63,62,61,60]
    
    let newNotAllowedHorizontal = notAllowedHorizontal.splice(0, 10 * lastShipIndex)
    let newNotAllowedVertical = notAllowedVertical.splice(0, 10 * lastShipIndex)

    selectedShipIndex = parseInt(selectedShipNameWithIndex.substr(-1))
   // selectedMineIndex = parseInt(selectedMineNameWithIndex.substr(-1))

    shipLastId = shipLastId - selectedShipIndex
    //mineLastId = shipLastId - selectedMineIndex
    // console.log(shipLastId)

    if (isHorizontal && !newNotAllowedHorizontal.includes(shipLastId)) {
      for (let i=0; i < draggedShipLength; i++) {
        let directionClass
        if (i === 0) directionClass = 'start'
        if (i === draggedShipLength - 1) directionClass = 'end'
        userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('horizontal', directionClass, shipClass)
        if (shipClass != 'mine1' && shipClass != 'mine2' && shipClass != 'mine3' && shipClass != 'mine4')
            //it's a ship
            userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('taken')
        else {
            userSquares[parseInt(this.dataset.id) - selectedShipIndex + i].classList.add('takenM')
        }
      }
    //As long as the index of the ship you are dragging is not in the newNotAllowedVertical array! This means that sometimes if you drag the ship by its
    //index-1 , index-2 and so on, the ship will rebound back to the displayGrid.
    } else if (!isHorizontal && !newNotAllowedVertical.includes(shipLastId)) {
      for (let i=0; i < draggedShipLength; i++) {
        let directionClass
        if (i === 0) directionClass = 'start'
        if (i === draggedShipLength - 1) directionClass = 'end'
        //console.log(userSquares[parseInt(this.dataset.id) - selectedShipIndex + width*i].classList)
        userSquares[parseInt(this.dataset.id) - selectedShipIndex + width*i].classList.add('vertical', directionClass, shipClass)
        if (shipClass != 'mine1' && shipClass != 'mine2' && shipClass != 'mine3' && shipClass != 'mine4')
            userSquares[parseInt(this.dataset.id) - selectedShipIndex + width*i].classList.add('taken')
        else {
            //it's a mine!
            userSquares[parseInt(this.dataset.id) - selectedShipIndex + width*i].classList.add('takenM')
        }
      }
    } else return

    displayGrid.removeChild(draggedShip)
    if(!displayGrid.querySelector('.ship')) {
         console.log("ships placed")
         allShipsPlaced = true
    }
  }

  function dragEnd() {
    // console.log('dragend')
  }

  // Game Logic for MultiPlayer
  function playGameMulti(socket) {
    setupButtons.style.display = 'none'
    if(isGameOver) return
    if(!ready) {
      socket.emit('player-ready')
      ready = true
      playerReady(playerNum)
    }

    if(enemyReady) {
      if(currentPlayer === 'user') {
        turnDisplay.innerHTML = 'Your Go'
      }
      if(currentPlayer === 'enemy') {
        turnDisplay.innerHTML = "Enemy's Go"
      }
    }
  }

  function playerReady(num) {
    let player = `.p${parseInt(num) + 1}`
    document.querySelector(`${player} .ready`).classList.toggle('active')
  }

  // Game Logic for Single Player
  function playGameSingle() {
    if (isGameOver) return
    if (currentPlayer === 'user') {
      turnDisplay.innerHTML = 'Your Go'
      computerSquares.forEach(square => square.addEventListener('click', function(e) {
        if (xBomberOn === true) {
            let centerShotIndex = computerSquares.indexOf(square)
            let shotsIndex = [centerShotIndex, centerShotIndex-9, centerShotIndex-11, centerShotIndex+9, centerShotIndex+11]
            for (let i=0; i<shotsIndex.length; i++) {
                let shotFired = computerSquares[shotsIndex[i]].dataset.id
                if (userSquaresSelected[shotFired] === false) {
                    computerSquares.forEach(square => square.removeEventListener('click', null))
                    userSquaresSelected[shotFired] = true
                    revealSquare(computerSquares[shotsIndex[i]].classList, false)
                }
            }
            xBomberOn = false
            enemyGo()
        }
        else if (tBomberOn === true) {
            let centerShotIndex = computerSquares.indexOf(square)
            let shotsIndex = [centerShotIndex, centerShotIndex+1, centerShotIndex-1, centerShotIndex+10, centerShotIndex-10]
            for (let i=0; i < shotsIndex.length; i++) {
                let shotFired = computerSquares[shotsIndex[i]].dataset.id
                if (userSquaresSelected[shotFired] === false) {
                    computerSquares.forEach(square => square.removeEventListener('click', null))
                    userSquaresSelected[shotFired] = true
                    revealSquare(computerSquares[shotsIndex[i]].classList, false)
                }
            }
            tBomberOn = false
            enemyGo()
        }
        else {
            shotFired = square.dataset.id
            if (userSquaresSelected[shotFired] === false) {
                computerSquares.forEach(square => square.removeEventListener('click', null))
                // console.log(shotFired)
                userSquaresSelected[shotFired] = true
                revealSquare(square.classList, true)
            }
        }
   //   else
   //         playGameSingle()
      }))
    }
    if (currentPlayer === 'enemy') {
      turnDisplay.innerHTML = 'Computers Go'
   //   console.log("calling enemy go")
      setTimeout(enemyGo, 1000)
      return
    }
  }

  let destroyerCount = 0
  let destroyer2Count = 0
  let submarineCount = 0
  let cruiserCount = 0
  let battleshipCount = 0
  let carrierCount = 0
  let shipsSunk = 0
  let totalCount = 0
  let allowPlayerSwitch = true

  function revealSquare(classList, allowPlayerSwitch) {
    console.log("allowPlayerSwitch = " + allowPlayerSwitch + "\n")
    const enemySquare = computerGrid.querySelector(`div[data-id='${shotFired}']`)
    //const obj = Object.values(classList)
    if (!classList.contains('boom') && !classList.contains('miss') && !classList.contains('mineboom')) {
      const hit = classList.contains('taken')
      classList.add(hit ? 'boom' : 'miss')
      if (classList.contains('mine1') || classList.contains('mine2') || classList.contains('mine3') || classList.contains('mine4')) {
            infoDisplay.innerHTML = "Careful! You hit one of the Computer's mines!"
            console.log("YOU HIT A MINE!\n")
            enemyGo()
      }
      if (classList.contains('destroyer')) {
          destroyerCount++
          console.log("destroyerCount: " + destroyerCount + "\n")
      }
      if (classList.contains('destroyer2')) {
          destroyer2Count++
          console.log("destroyer2Count: " + destroyer2Count + "\n")
      }
      if (classList.contains('submarine')) {
           submarineCount++
           console.log("submarineCount: " + submarineCount + "\n")
      }
      if (classList.contains('cruiser')) {
          cruiserCount++
          console.log("cruiserCount: " + cruiserCount + "\n")
      }
      if (classList.contains('battleship')) {
          battleshipCount++
          console.log("battleshipCount: " + battleshipCount + "\n")
      }
      if (classList.contains('carrier')) {
          carrierCount++
          console.log("carrierCount: " + carrierCount + "\n")
      }
    }
    /*
    if (classList('taken')) {
      enemySquare.classList.add('boom')
      totalCount++
   //   console.log("totalCount: " + totalCount +"\n")
    } else {
      enemySquare.classList.add('miss')
    }*/
    checkForWins()
    if (!allowPlayerSwitch) {
        currentPlayer = 'user'
    }
    else {
        currentPlayer = 'enemy'
    }
    if(gameMode === 'singlePlayer') playGameSingle()
  }

  let cpuDestroyerCount = 0
  let cpuDestroyer2Count = 0
  let cpuSubmarineCount = 0
  let cpuCruiserCount = 0
  let cpuBattleshipCount = 0
  let cpuCarrierCount = 0
  let cpuShipsSunk = 0
  let cpuDestroyerPoss = []
  let turn = true
  
  let cpuGuess = [0,2,4,6,8,11,13,15,17,19,20,22,24,26,28,31,33,35,37,39,40,42,44,46,48,51,53,55,57,59,60,62,64,66,68,71,73,75,77,79,80,82,84,86,88,91,93,95,97,99]
  let cpuGuessAfterHit = [[1,2,3,70],[4,5,6,71],[7,8,9,72],[10,11,12,73]]
  let left = []
  let right = []
  let up = []
  let down = []
  let cpuGAH = false
  let cpuA = 0
  let cpuB = 0
  let cpuShipsSunkCheck = 1

  function enemyGo(square) {
    if (turn === false) {
        infoDisplay.innerHTML = "skipping CPU's turn"
        currentPlayer = 'user'
        turnDisplay.innerHTML = 'Your Go'
        turn = true
        return
    }
    if (cpuShipsSunk === cpuShipsSunkCheck) {
        cpuShipsSunkCheck++
        left = []
        right = []
        up = []
        down = []
        cpuA = 0
        cpuB = 0
        cpuGAH = false
    }
    if (cpuGAH) {
        console.log("cpuShipsSunk: " + cpuShipsSunk + "\n")
        console.log("cpuShipsSunkCheck: " + cpuShipsSunkCheck + "\n")
        square = cpuGuessAfterHit[cpuA][cpuB]
        cpuB++
        if (!userSquares[square].classList.contains('taken')) {
            cpuA++
            cpuB = 0
        } 
    }
    else {
        square = cpuGuess[Math.floor(Math.random()*cpuGuess.length)]
    }

    //if (gameMode === 'singlePlayer') square = Math.floor(Math.random() * userSquares.length)
   // console.log("Enemy is going")
    if (!userSquares[square].classList.contains('boom') && !userSquares[square].classList.contains('miss') && !userSquares[square].classList.contains('mineboom')) {
      const hit = userSquares[square].classList.contains('taken')
      const hitM = userSquares[square].classList.contains('takenM')
      if (hitM) userSquares[square].classList.add('mineboom')
      else {
          userSquares[square].classList.add(hit ? 'boom' : 'miss')
      }
      //Jakon's AI code
      if (hit && !cpuGAH) {
          left = [square - 1, square - 2, square - 3, square - 4]
          for (i=3; i> -1; i--) {
              if (left[i] > 99 || left[i] < 0) {
                  left.splice(i,1)
              }
          }
          right = [square + 1, square + 2, square + 3, square + 4]
          for (i=3; i > -1; i--) {
              if (right[i] > 99 || right[i] < 0) {
                  right.splice(i,1)
              }
          }
          up = [square - 10, square - 20, square - 30, square - 40]
          for (i=3; i > -1; i--) {
              if (up[i] > 99 || up[i] < 0) {
                  up.splice(i,1)
              }
          }
          down = [square + 10, square + 20, square + 30, square + 40]
          for (i=3; i > -1; i--) {
              if (down[i] > 99 || down[i] < 0) {
                  down.splice(i, 1)
              }
          }
          cpuGuessAfterHit = [left, right, up, down]
          cpuGAH = true
      }
     // if (cpuShipsSunk === cpuShipsSunkCheck) {
     //     cpuShipsSunkCheck++
     //     cpuGAH = false
    //  }
       //end Jakon's AI
      if (userSquares[square].classList.contains('mine1')) {
          infoDisplay.innerHTML = 'The CPU hit a mine!'
          turn = false
         // console.log("hitM = " + hitM + "\n")   
         // console.log("hit = " + hit + "\n")
         // console.log("CPU HIT A MINE!\n")
      }
      if (userSquares[square].classList.contains('mine2')) {
          infoDisplay.innerHTML = 'The CPU hit a mine!'
          turn = false
       //   console.log("hitM = " + hitM + "\n")
       //   console.log("hit = " + hit + "\n")
       //   console.log("MINE\n")
      }
      if (userSquares[square].classList.contains('mine3')) {
          infoDisplay.innerHTML = 'The CPU hit a mine!'
          turn = false
       //   console.log("hitM = " + hitM + "\n")
       //   console.log("hit = " + hit + "\n")
       //   console.log("MINE\n")
      }
      if (userSquares[square].classList.contains('mine4')) {
          infoDisplay.innerHTML = 'The CPU hit a mine!'
          turn = false
       //   console.log("hitM = " + hitM + "\n")
       //   console.log("hit = " + hit + "\n")
       //   console.log("MINE\n")
      }
      if (userSquares[square].classList.contains('destroyer')) {
          cpuDestroyerCount++
     //     console.log("cpuDestroyerCount = " + cpuDestroyerCount + "\n")
      }
      if (userSquares[square].classList.contains('destroyer2')) {
          cpuDestroyer2Count++
       //   console.log("cpuDestroyer2Count = " + cpuDestroyer2Count + "\n")
      }
      if (userSquares[square].classList.contains('submarine')) {
          cpuSubmarineCount++
       //   console.log("cpuSubmarineCount = " + cpuSubmarineCount + "\n")
      }
      if (userSquares[square].classList.contains('cruiser')) {
          cpuCruiserCount++
       //   console.log("cpuCruiserCount = " + cpuCruiserCount + "\n")
      }
      if (userSquares[square].classList.contains('battleship')) {
          cpuBattleshipCount++
       //   console.log("cpuBattleshipCount = " + cpuBattleshipCount + "\n")
      }
      if (userSquares[square].classList.contains('carrier')) {
          cpuCarrierCount++
       //   console.log("cpuCarrierCount = " + cpuCarrierCount + "\n")
      }
      checkForWins()
    } else {
         enemyGo()
    }
    currentPlayer = 'user'
    //infoDisplay.innerHTML = ''
    turnDisplay.innerHTML = 'Your Go'
  }

  function checkForWins() {
    let enemy = 'computer'
    if(gameMode === 'multiPlayer') enemy = 'enemy'
    if (destroyerCount === 2) {
      infoDisplay.innerHTML = `You sunk the ${enemy}'s destroyer`
      destroyerCount = 10
      shipsSunk++
    }
    if (destroyer2Count === 2) {
      infoDisplay.innerHTML = `You sunk the ${enemy}'s 2nd destroyer`
      destroyer2Count = 10
      shipsSunk++
    }
    if (submarineCount === 3) {
      infoDisplay.innerHTML = `You sunk the ${enemy}'s submarine`
      submarineCount = 10
      shipsSunk++
    }
    if (cruiserCount === 3) {
      infoDisplay.innerHTML = `You sunk the ${enemy}'s cruiser`
      cruiserCount = 10
      shipsSunk++
    }
    if (battleshipCount === 4) {
      infoDisplay.innerHTML = `You sunk the ${enemy}'s battleship`
      battleshipCount = 10
      shipsSunk++
    }
    if (carrierCount === 5) {
      infoDisplay.innerHTML = `You sunk the ${enemy}'s carrier`
      carrierCount = 10
      shipsSunk++
    }
    if (cpuDestroyerCount === 2) {
      infoDisplay.innerHTML = `${enemy} sunk your destroyer`
      cpuDestroyerCount = 10
      cpuShipsSunk++
    }
    if (cpuDestroyer2Count === 2) {
      infoDisplay.innerHTML = `${enemy} sunk your 2nd destroyer`
      cpuDestroyer2Count = 10
      cpuShipsSunk++
    }
    if (cpuSubmarineCount === 3) {
      infoDisplay.innerHTML = `${enemy} sunk your submarine`
      cpuSubmarineCount = 10
      cpuShipsSunk++
    }
    if (cpuCruiserCount === 3) {
      infoDisplay.innerHTML = `${enemy} sunk your cruiser`
      cpuCruiserCount = 10
      cpuShipsSunk++
    }
    if (cpuBattleshipCount === 4) {
      infoDisplay.innerHTML = `${enemy} sunk your battleship`
      cpuBattleshipCount = 10
      cpuShipsSunk++
    }
    if (cpuCarrierCount === 5) {
      infoDisplay.innerHTML = `${enemy} sunk your carrier`
      cpuCarrierCount = 10
      cpuShipsSunk++
    }

    if (((destroyerCount + destroyer2Count + submarineCount + cruiserCount + battleshipCount + carrierCount) === 60) || (shipsSunk === 6)) {
      infoDisplay.innerHTML = "YOU WIN"
      gameOver()
    }
    if (((cpuDestroyerCount + cpuDestroyer2Count + cpuSubmarineCount + cpuCruiserCount + cpuBattleshipCount + cpuCarrierCount) === 60) || (cpuShipsSunk === 6)) {
      infoDisplay.innerHTML = `${enemy.toUpperCase()} WINS`
      gameOver()
    }
  }

  function gameOver() {
    isGameOver = true
    startButton.removeEventListener('click', playGameSingle)
  }
})
