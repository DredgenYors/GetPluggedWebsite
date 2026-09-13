from getpluggedv1 import app, db, User  # adjust import to your file name

with app.app_context():
    # change to your login identifier (email/username)
    me = User.query.filter_by(username="b.leebusinessemail@gmail.com").first()
    if not me:
        me = User(username="b.leebusinessemail@gmail.com")
        me.set_password("BranmaxGP1703*")
        db.session.add(me)

    me.role = "super_admin"
    db.session.commit()
    print("✅ Super admin ready:", me.username, me.role)
