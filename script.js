(function(){

    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyBSG55dlC9IerlUsdY8gq8yEfqn-d5RrWw",
        authDomain: "apartmentcheck-6831c.firebaseapp.com",
        databaseURL: "https://apartmentcheck-6831c.firebaseio.com",
        projectId: "apartmentcheck-6831c"
    };
    firebase.initializeApp(config);

    var root = null;
    var useHash = true; // Defaults to: false
    var router = new Navigo(root, useHash);

    router
      .on({
      'login': function () {
      
        // FirebaseUI config.
        var uiConfig = {
            signInSuccessUrl: '#checklists/new', // TODO ELin set up
            signInOptions: [
              firebase.auth.GoogleAuthProvider.PROVIDER_ID,
              firebase.auth.FacebookAuthProvider.PROVIDER_ID,
              firebase.auth.TwitterAuthProvider.PROVIDER_ID
            ],
            // Terms of service url.
            tosUrl: '<your-tos-url>' // TODO elin
        };

        var ui = new firebaseui.auth.AuthUI(firebase.auth());
        ui.start('.content', uiConfig);
      
        document.querySelector('.js-view-login-page').innerHTML = tmpl('js-view-login-page', snapshot.val());
      },
      'checklists/new': function(){
            var defaultCheckListRef = firebase.database().ref('default-checklist');
            defaultCheckListRef.once('value', function(snapshot) {
                document.querySelector('.content').innerHTML = tmpl('checklist', snapshot.val());

                document.querySelectorAll('.js-show-comment').forEach((element) => {
                        element.addEventListener('click', (e) => {
                        let commentInput = e.target.parentElement.querySelector('.js-comment');
                        commentInput.classList.remove('hidden');
                        e.target.className += ' hidden';
                        e.target.parentElement.querySelector('.js-hide-comment').classList.remove('hidden');
                    });
                });

                document.querySelectorAll('.js-hide-comment').forEach((element) => {
                        element.addEventListener('click', (e) => {
                        let commentInput = e.target.parentElement.querySelector('.js-comment');
                        commentInput.className += ' hidden';
                        e.target.className += ' hidden';
                        e.target.parentElement.querySelector('.js-show-comment').classList.remove('hidden');
                    });
                });

                document.querySelector('.js-save-checklist').addEventListener('click', () => {
                    let checklist = collectData();
                    writeUserChecklist(firebase.auth().currentUser.uid, checklist);
                });

                function collectData(){
                    let checklist = {
                        name: document.querySelector('.js-checklist-name').value,
                        checkItems: []
                    };
                    document.querySelectorAll('.js-list-item').forEach((element) => {
                        let listItem = {};
                        listItem.description = element.querySelector('.js-description').innerHTML;
                        listItem.meetsRequirements = element.querySelector('.js-meets-requirements').value === 'on';
                        listItem.comment = element.querySelector('.js-comment').value;
                        checklist.checkItems.push(listItem);
                    });

                    return checklist;
                }

                function writeUserChecklist(userId, checklist) {
                  var key = firebase.database()
                                       .ref('users/' + userId + '/checklists/')
                                       .push()
                                       .key;
                  firebase.database()
                          .ref('users/' + userId + '/checklists/' + key)
                          .set(checklist)
                          .then(() => {
                            alert('Väl sparat min vän!');
                          })
                          .catch(() => {
                            console.log('uh-oh! nu blev det fel');
                          });
                }

                let userId = firebase.auth().currentUser.uid;
                let defaultChecklistListRef = firebase.database().ref('users/' + userId + '/checklists');
                defaultChecklistListRef.on('value', function(snapshot) {
                    let checklists = snapshot.val();
                    let templateFriendlyChecklists = [];
                    for(var i in checklists){
                        if(checklists.hasOwnProperty(i)){
                            checklists[i].id = i;
                            templateFriendlyChecklists.push(checklists[i]);
                        }
                    }

                    document.querySelector('.checklist-list').innerHTML = tmpl('checklist-list', templateFriendlyChecklists);

                    let deleteButtons = document.querySelectorAll('.js-delete-checklist');
                    deleteButtons.forEach((deleteButton) => {
                        deleteButton.addEventListener('click', (e) => {
                            let id = e.target.dataset.checklistId;
                            let checklistToBeDeletedRef = firebase.database().ref('users/' + userId + '/checklists/' + id);
                            checklistToBeDeletedRef.remove();
                        });
                    });


                    let editButtons = document.querySelectorAll('.js-edit-checklist');
                    editButtons.forEach((editButton) => {
                        editButton.addEventListener('click', (e) => {
                            let id = e.target.dataset.checklistId;
                            let checklistToBeEditedRef = firebase.database().ref('users/' + userId + '/checklists/' + id);
                            checklistToBeEditedRef.once('value', (snapshot) => {
                                console.log(snapshot.val());
                            }); 
                        });
                    });
                });
            });
          } 
      }).resolve();

    

    document.querySelector('.signout').addEventListener('click', () => {
        firebase.auth().signOut().then(function() {
          // Sign-out successful.
        }).catch(function(error) {
          // An error happened.
        });
    });
})();