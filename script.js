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
        signInSuccessUrl: '#/checklists',
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
                                                let newList = {
                                                                name: '',
                                                                adUrl: '',
                                                                checkItems: snapshot.val()
                                                                };
                                                document.querySelector('.content').innerHTML = tmpl('checklist', newList);
                                                addEventListeners();
                                              });
            
      },
      'checklists/:id': function(params){
        let userId = window.currentUser.uid;
        let checklistToBeViewedRef = firebase.database().ref('users/' + userId + '/checklists/' + params.id);
            checklistToBeViewedRef.once('value', (snapshot) => {
            document.querySelector('.content').innerHTML = tmpl('checklist-summary', snapshot.val());
            addEventListeners();
        });
      },
      'checklists/:id/edit': function(params){
        let userId = window.currentUser.uid;
        let checklistToBeEditedRef = firebase.database().ref('users/' + userId + '/checklists/' + params.id);
            checklistToBeEditedRef.once('value', (snapshot) => {
            document.querySelector('.content').innerHTML = tmpl('checklist', snapshot.val());
            addEventListeners();
        });
      },
      'checklists': function(params){
        let userId = window.currentUser.uid;
        let checklistsRef = firebase.database()
                                    .ref('users/' + userId + '/checklists');
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

            let viewButtons = document.querySelectorAll('.js-view-checklist');
            viewButtons.forEach((viewButton) => {
                viewButton.addEventListener('click', (e) => {
                    let id = e.target.dataset.checklistId;
                    router.navigate('/checklists/' + id);
                });
            });
        }); 
      }
    }).resolve();
    
    function addEventListeners() {
        let saveButtons = document.querySelectorAll('.js-save-checklist');
        saveButtons.forEach((saveButton) => {
                saveButton.addEventListener('click', () => {
                    let checklist = collectData();
                    writeUserChecklist(window.currentUser.uid, checklist);
                });
        });
        let editButtons = document.querySelectorAll('.js-edit-checklist');
        editButtons.forEach((editButton) => {
            editButton.addEventListener('click', () => {
                let checklistId = window.location.href.split('/').pop();
                router.navigate('/checklists/' + checklistId + '/edit');
            });
        });
        let deleteButtons = document.querySelectorAll('.js-delete-checklist');
        deleteButtons.forEach((deleteButton) => {
            deleteButton.addEventListener('click', (e) => {
                let userId = window.currentUser.uid;
                let checklistId = window.location.href.split('/').pop();
                let checklistToBeDeletedRef = firebase.database().ref('users/' + userId + '/checklists/' + checklistId);
                checklistToBeDeletedRef.remove().then(() => {
                    router.navigate('/checklists');
                });
            });
        });
        let navigateToCheckListButtons = document.querySelectorAll('.js-navigate-to-checklist');
        navigateToCheckListButtons.forEach((navigateToCheckListButton) => {
            navigateToCheckListButton.addEventListener('click', (e) => {
                event.preventDefault();
                
                if(window.location.href.split('/').pop() === 'new'){
                    router.navigate('/checklists');
                } else {
                    let splittedUrl = window.location.href.split('/');
                    let checkListId = splittedUrl[splittedUrl.length-2];
                    router.navigate('/checklists/' + checkListId);
                }
            });
        });
        let signOutButtons = document.querySelectorAll('.js-signout');
        signOutButtons.forEach((signOutButton) => {
            signOutButton.addEventListener('click', () => {
                firebase.auth()
                        .signOut()
                        .then(function() {
                          router.navigate('/login');
                        }).catch(function(error) {
                          // An error happened. :(
                        });
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
                    listItem.meetsRequirements = element.querySelector('.js-meets-requirements').checked;
                    listItem.comment = element.querySelector('.js-comment').value;
                    checklist.checkItems.push(listItem);
                });
        return checklist;
    }
    
    function writeUserChecklist(userId, checklist) {
      let key = '';
      if(window.location.href.split('/').pop() === 'edit'){
          let splittedUrl = window.location.href.split('/');
          key = splittedUrl[splittedUrl.length-2];
      }else {
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