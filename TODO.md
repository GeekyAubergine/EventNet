# TODO For mark scheme
- [x] Users can login with OAuth.
- [x] Users can use the site anonymously without having to log in.
- [x] Users can create an Event.
- [x] Users can join an Event.
- [x] Users can view the location of Events relative to their location on a map which shows the user's location.
- [ ] Users can view archived Events.
- [x] Users can post a post within an Event.
- [ ] Users can edit their own posts.
- [ ] Users can delete their own posts.
- [ ] Users can upload images in posts.
- [ ] Users can upload videos in posts.
- [x] New posts are automatically loaded at the top of the ‘feed’ when another user posts them, this does not require the user to reload the page.
- [x] Users can report posts, a posts with a high number of reports (will be set between 5 and 10) will be flagged and not loaded for other users.
- [x] Users can comment on a post.
- [ ] Users can edit their own comments.
- [ ] Users can delete their own comments.
- [x] Users can report comments, a comment with a high number of reports (will be set between 5 and 10) will be flagged and not loaded for other users.
- [x] Events, posts, comments and messages are shown with a distance from their creation location to the user’s current location.
- [ ] Users can view an activity map that shows all ‘activity’ on a map relative to the user’s location.
- [x] A user’s current location is updated as it changes, this affects the order in which Events are listed and affects the distance from a user that is listed in Events, posts, comments and instant messages.

- [x] Users can join an Event and instantly messages with other users on the same Event.

- [ ] Users can search for a string/phrases and it will load all Events (including archived Events), posts and comments where their content matches the given phrase. This will also search for usernames that match the search phrase.

## General to do list
- Add achived to network table and implement in io
- Add edited field to post and comment
- Save users previous location and use for location before more accurate results comes in
- When comment or post is delete delete associated media
