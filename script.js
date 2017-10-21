(function(){

    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyBSG55dlC9IerlUsdY8gq8yEfqn-d5RrWw",
        authDomain: "apartmentcheck-6831c.firebaseapp.com",
        databaseURL: "https://apartmentcheck-6831c.firebaseio.com",
        projectId: "apartmentcheck-6831c"
    };
    firebase.initializeApp(config);
    
    // FirebaseUI config.
    var uiConfig = {
        signInSuccessUrl: '#/checklists/new',
        signInOptions: [
          firebase.auth.GoogleAuthProvider.PROVIDER_ID
        ],
        // Terms of service url.
        tosUrl: '<your-tos-url>' // TODO
    };


    var ui = new firebaseui.auth.AuthUI(firebase.auth());
    var root = null;
    var useHash = true;
    var router = new Navigo(root, useHash);

    router.hooks({
      before: function(done) {
        firebase.auth().onAuthStateChanged(function(user) {
          if (user) {
            window.currentUser = user;
          } else {
            window.currentUser = null;
          }
          done();
        });
      }
    });

    router
      .on({
      'login': function () {
        ui.start('.content', uiConfig);
      },
      'checklists/new': function(){
            var defaultCheckListRef = firebase.database()
                                              .ref('default-checklist');
            defaultCheckListRef.once('value', function(snapshot) {
                                                document.querySelector('.content').innerHTML = tmpl('checklist', snapshot.val());
                                                addEventListeners();
                                              });
            
          },
      'checklists/:id': function(params){
        let userId = window.currentUser.uid;
        let checklistToBeEditedRef = firebase.database().ref('users/' + userId + '/checklists/' + params.id);
            checklistToBeEditedRef.once('value', (snapshot) => {
            document.querySelector('.content').innerHTML = tmpl('checklist', snapshot.val());
            addEventListeners();
        });
      },
      'checklists': function(params){
        let userId = window.currentUser.uid;
        let checklistsRef = firebase.database().ref('users/' + userId + '/checklists');
            checklistsRef.on('value', (snapshot) => {
            let checklists = snapshot.val();
            let templateFriendlyChecklists = [];
            for(var i in checklists){
                if(checklists.hasOwnProperty(i)){
                    checklists[i].id = i;
                    templateFriendlyChecklists.push(checklists[i]);
                }
            }
            document.querySelector('.content').innerHTML = tmpl('checklist-list', templateFriendlyChecklists);

            let editButtons = document.querySelectorAll('.js-edit-checklist');
            editButtons.forEach((editButton) => {
                editButton.addEventListener('click', (e) => {
                    let id = e.target.dataset.checklistId;
                    router.navigate('/checklists/' + id);
                });
            });

            let deleteButtons = document.querySelectorAll('.js-delete-checklist');
            deleteButtons.forEach((deleteButton) => {
                deleteButton.addEventListener('click', (e) => {
                    let id = e.target.dataset.checklistId;
                    let checklistToBeDeletedRef = firebase.database().ref('users/' + userId + '/checklists/' + id);
                    checklistToBeDeletedRef.remove();
                    e.stopPropagation();
                });
            });
        }); 
      }
    }).resolve();

    document.querySelector('.js-signout')
            .addEventListener('click', () => {
                firebase.auth().signOut()
                        .then(function() {
                          router.navigate('/login');
                        }).catch(function(error) {
                          // An error happened. :(
                        });
            });
    
    function addEventListeners() {
        document.querySelector('.js-save-checklist')
                .addEventListener('click', () => {
                    let checklist = collectData();
                    writeUserChecklist(window.currentUser.uid, checklist);
                });
                
        document.querySelectorAll('.js-hide-comment')
                .forEach((element) => {
                    element.addEventListener('click', (e) => {
                                                            let commentInput = e.target.parentElement.querySelector('.js-comment');
                                                            commentInput.className += ' hidden';
                                                            e.target.className += ' hidden';
                                                            e.target.parentElement.querySelector('.js-show-comment').classList.remove('hidden');
                                                        });
        });
        
        document.querySelectorAll('.js-show-comment')
                .forEach((element) => {
                    element.addEventListener('click', (e) => {
                    let commentInput = e.target.parentElement.querySelector('.js-comment');
                    commentInput.classList.remove('hidden');
                    e.target.className += ' hidden';
                    e.target.parentElement.querySelector('.js-hide-comment').classList.remove('hidden');
                });
        });
    }
    
    function collectData(){
        let checklist = {
            name: document.querySelector('.js-checklist-name').value,
            adUrl: document.querySelector('.js-checklist-ad-url').value,
            checkItems: []
        };
        document.querySelectorAll('.js-list-item')
                .forEach((element) => {
                    let listItem = {};
                    listItem.description = element.querySelector('.js-description').innerHTML;
                    listItem.meetsRequirements = element.querySelector('.js-meets-requirements').value === 'on';
                    listItem.comment = element.querySelector('.js-comment').value;
                    checklist.checkItems.push(listItem);
                });
        return checklist;
    }
    
    function writeUserChecklist(userId, checklist) {
      let key = window.location.href.split('/').pop();
      
      if(key === 'new'){
        key = firebase.database()
                .ref('users/' + userId + '/checklists/')
                .push()
                .key;
      }
      
      firebase.database()
              .ref('users/' + userId + '/checklists/' + key)
              .set(checklist)
              .then(() => {
                router.navigate('/checklists');
              })
              .catch(() => {
                console.log('uh-oh! nu blev det fel');
              });
    }
})();