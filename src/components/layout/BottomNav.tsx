import { NavLink } from 'react-router-dom'

const BottomNav = () => {
  return (
    <nav className="bottom-nav">
      <NavLink to="/notice">공지</NavLink>
      <NavLink to="/timetable">공연</NavLink>
      <NavLink to="/">홈</NavLink>
      <NavLink to="/map">부스맵</NavLink>
      <NavLink to="/lost-item">분실물</NavLink>
    </nav>
  )
}

export default BottomNav
