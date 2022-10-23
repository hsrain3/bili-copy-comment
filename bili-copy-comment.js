
window.addEventListener('load', () => {
    console.log("test")
    var url = window.location.href;
    //console.log(url)
    var reg1 =new RegExp("https://t.bilibili.com/[0-9].*")  //dynamic
    var reg2 = new RegExp("https://www.bilibili.com/v/topic/(.*)") 
    const DEBUG = true;
    function debug(description = '', msg = '', force = false) {
        if (DEBUG || force) {
          console.log(`${description}`, msg)
        }
      }
    function attachEl(item) {
        let injectWrap = item.querySelector('.con .info');
    
        // .text - comment content
        // .text-con - reply content
        let content = item.querySelector('.con .text') || item.querySelector('.reply-con .text-con');
        let id = item.dataset.id;
    
        // Simple way to attach element on replies initially loaded with comment
        // which wouldn't trigger mutation inside observeComments
        let replies = item.querySelectorAll('.con .reply-box .reply-item');
        if (replies.length > 0) {
          [...replies].map(reply => {
            attachEl(reply);
          });
        }
        
        if (injectWrap.querySelector('.asoulcnki')) {
          debug('already loaded for this comment');
        } else {
                // Insert asoulcnki check button
                let copyButton = document.createElement('span');

                copyButton.classList.add('asoulcnki', 'btn-hover', 'btn-highlight');
                copyButton.innerHTML = '复制链接';
                let oid = ""
                let root = item.getAttribute('data-id')
                console.log(root)
                copyButton.addEventListener('click', e => {
                //prepare url
                
                if(url.match(reg1)) {
                    //console.log(root)
                    let reg = /\d+/
                    var o = reg.exec(url)
                    console.log(o[0])
                    oid = o[0]
                    
                }

                var commentUrl = "https://www.bilibili.com/h5/comment/sub?oid=" + oid + "&pageType=17" + "&root="+root
                navigator.clipboard.writeText(commentUrl)
            })
            injectWrap.querySelector('.operation').before(copyButton);

        }
    }

    function observeComments(wrapper) {
        // .comment-list - general list for video, zhuanlan, and dongtai
        // .reply-box - replies attached to specific comment
        let commentLists = wrapper ? wrapper.querySelectorAll('.comment-list, .reply-box') : document.querySelectorAll('.comment-list, .reply-box');
    
        if (commentLists) {
    
          [...commentLists].map(commentList => {
    
            // Directly attach elements for pure static server side rendered comments
            // and replies list. Used by zhuanlan posts with reply hash in URL.
            // TODO: need a better solution
            [...commentList.querySelectorAll('.list-item, .reply-item')].map(item => {  //list item
              attachEl(item);
            });
    
            const observer = new MutationObserver((mutationsList, observer) => {
    
              for (const mutation of mutationsList) {
    
                if (mutation.type === 'childList') {
    
                  debug('observed mutations', [...mutation.addedNodes].length);
    
                  [...mutation.addedNodes].map(item => {
                    attachEl(item);
    
                    // Check if the comment has replies
                    // I check replies here to make sure I can disable subtree option for
                    // MutationObserver to get better performance.
                    let replies = item.querySelectorAll('.con .reply-box .reply-item');
    
                    if (replies.length > 0) {
                      observeComments(item)
                      debug(item.dataset.id + ' has rendered reply(ies)', replies.length);
                    }
                  })
                }
              }
            });
            observer.observe(commentList, { attributes: false, childList: true, subtree: false });
          });
        }
      }
      observeComments();
    const wrapperObserver = new MutationObserver((mutationsList, observer) => {

        for (const mutation of mutationsList) {
    
          if (mutation.type === 'childList') {
    
            [...mutation.addedNodes].map(item => {
              debug('mutation wrapper added', item);
    
              if (item.classList?.contains('bb-comment')) {
                debug('mutation wrapper added (found target)', item);
    
                observeComments(item);
    
                // Stop observing
                // TODO: when observer stops it won't work for dynamic homepage ie. https://space.bilibili.com/703007996/dynamic
                // so disable it here. This may have some performance impact on low-end machines.
                // wrapperObserver.disconnect();
              }
            })
          }
        }
      });
      wrapperObserver.observe(document.body, { attributes: false, childList: true, subtree: true });


}, false);