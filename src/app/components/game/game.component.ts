import { Component, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SocketioService } from '../../services/socketio.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit {

  gameId: string | null = null;
  mode: string | null = null;
  words: any;
  Called = false;
  isResultCardVisible: boolean = false;
  
  currTeam = 'blue';
  winner: string = '';
  
  blueScore: number = 0;
  redScore: number = 0;
  
  clientAnimal: any;
  yourAnimal: any;
  role = 'operative';
  yourTeam: any;

  wordArray: NodeListOf<HTMLElement> | undefined;

  constructor(
    private socketIoService: SocketioService,
    private route: ActivatedRoute,
    private snackbar: MatSnackBar,
  ) {}

  ngOnInit(): void {
      
    this.gameId = this.route.snapshot.paramMap.get('id');
    this.mode = this.route.snapshot.paramMap.get('mode');
    this.socketIoService.connect(this.gameId, this.mode);
    this.role = 'operative';


    if(this.mode === 'join-game')
      this.joinGame();
    
    this.recieveCreateGameAck();
    this.recieveJoinedPlayers();
    this.recieveStartGame();
    this.recieveGameUpdate();
    this.AssignAnimal();
    this.allotTeamsandRole();
  }



  nextGame() {
    this.blueScore = 0;
    this.redScore = 0;
    this.winner = '';
    this.currTeam = 'blue';
    this.Called = true;
    this.words = null;

    let gameBoard = document.querySelector('.game') as HTMLElement;
    gameBoard.style.display = 'block';

    let element = document.querySelector('.ack') as HTMLElement;
    element.style.display = 'none';
    this.isResultCardVisible = false;
  
    this.socketIoService.nextGame(this.gameId);
  }

  startGame() {
    this.Called = true;
    this.socketIoService.startGame(this.gameId);
  }
  wordsCame(){
    this.wordArray = document.querySelectorAll('.word') as NodeListOf<HTMLElement>;
    console.log(this.wordArray)
    this.scrollTo();
  }
  scrollTo() {
    this.wordArray = document.querySelectorAll('.word') as NodeListOf<HTMLElement>;
    if (this.wordArray) {
      let middleWord = this.wordArray[Math.floor(this.wordArray.length / 2)] as HTMLElement;
      middleWord.scrollIntoView({ behavior: 'smooth' });
    }
  }

  joinGame(){
    this.socketIoService.joinGame(this.gameId);
  }

  clickWord(word: any) {
    let clickedWordColor = word.color;

    if(clickedWordColor === 'blue'){
      this.blueScore++;
    }
    else if(clickedWordColor === 'red'){
      this.redScore++;
    }
    word.selected = true;
    this.socketIoService.sendGameUpdate(this.gameId, this.words);
    this.currTeam = this.currTeam === 'blue' ? 'red' : 'blue';
  }

  copyToClipboard(gameId: string | null) {
    if (gameId == null) return;
    
    gameId = gameId.trim();
    navigator.clipboard.writeText(gameId);

    this.snackbar.open('Link copied to clipboard', '', {
      duration: 2000,
      panelClass: ['my-snackbar'],
    });
  }

  recieveCreateGameAck() {
    this.socketIoService.recieveCreateGameAck().subscribe((message: any) => {
      this.snackbar.open(message, '', {
        duration: 2000,
        panelClass: ['my-snackbar'],
      });
    });
  }

  recieveJoinedPlayers() {
    this.socketIoService.recieveJoinedPlayers().subscribe((message: any) => {
      this.Called = false;
      this.snackbar.open(message, '', {
        duration: 2000,
        panelClass: ['my-snackbar'],
      });
    });
  }

  recieveStartGame() {
   this.socketIoService.recieveStartGame().subscribe((words) => {
      this.words = words;
      this.Called = false;
      this.snackbar.open('The Game has Started !!', '', {
        duration: 2000,
        panelClass: ['my-snackbar'], 
      });
    });
  }

  recieveGameUpdate() {
    this.socketIoService.recieveGameUpdate(this.gameId).subscribe((words) => {
      this.words = words;
      this.updateScoreBoard(this.words);
    });
  }

  updateScoreBoard(words: any) {

    let blueScore = 0;
    let redScore = 0;

    for(let i = 0; i < words.length; i++){
      if(words[i].selected){
        if(words[i].color === 'blue'){
          blueScore++;
        }
        else if(words[i].color === 'red'){
          redScore++;
        }
        else if(words[i].color === 'black' ){
          if(this.currTeam === 'blue'){
            this.winner = 'blue';
          }
          else{
            this.winner = 'red';
          }
          this.winner = this.winner.toUpperCase();
          setTimeout(() => {
            this.showResultCard();
          }, 3000);
          return ;
        }
      }

      this.blueScore = blueScore;
      this.redScore = redScore;

      if(blueScore === 8){
        this.winner = 'blue';
      }
      else if(redScore === 9){
        this.winner = 'red';
      }
    }

  }

  showResultCard() {
    let gameBoard = document.querySelector('.game') as HTMLElement;
    gameBoard.style.display = 'none';

    let element = document.querySelector('.ack') as HTMLElement;
    element.style.display = 'block';
    this.isResultCardVisible = true;

    return ;
  }

  AssignAnimal() {
    this.socketIoService.AssignAnimal().subscribe((data: any) => {
      this.clientAnimal = data.clients
      this.yourAnimal = data.yourAnimal;
    });
  }

  allotTeamsandRole() {
    this.socketIoService.allotTeamsandRole().subscribe((data: any) => {
      this.role = data.role;
      this.yourTeam = data.team;
    });
  }


}
