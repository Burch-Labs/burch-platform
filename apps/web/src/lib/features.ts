/**
 * Pre-launch feature switches.
 *
 * Each of these hides a surface that is built, tested and working, but that we
 * do not want live at launch. They are flags rather than deletions precisely
 * because all three are coming back — flipping one to `true` restores the
 * feature without touching a component.
 *
 * Keep the guards shallow: hide the UI, leave the data model, the queries and
 * the partner-side tooling alone. Partners can still manage menus in their
 * dashboard while `menus` is false; guests simply do not see them yet.
 */
export const FEATURES = {
  /**
   * Guest ratings and review counts on cards and detail pages.
   *
   * Off until real guests have stayed and eaten. The review tables, the
   * submission form and the aggregate queries all still work — there is just
   * nothing worth showing while every venue would read zero.
   */
  ratings: false,

  /**
   * A hotel's star classification — the ★★★★★ badge and the sidebar filter.
   *
   * Distinct from `ratings`: this is the property's official category rather
   * than guest opinion. Off because the tiers in our seed are our own reading
   * of each hotel, not a classification we have confirmed with the operator or
   * the regulator, and stating one incorrectly misrepresents the business.
   * Sorting by stars still works if a caller passes the query parameter; only
   * the badge and the filter control are hidden.
   */
  starRating: false,

  /**
   * Public menus on restaurant listings and detail pages.
   *
   * Off because the prices we hold are illustrative rather than confirmed by
   * each restaurant. Showing a real venue's dishes at invented prices is worse
   * than showing no menu at all.
   */
  menus: false,

  /**
   * Taking hotel bookings and restaurant reservations ourselves.
   *
   * Off pre-launch: guests are sent to the venue's own booking page instead.
   * Nothing is charged and no inventory is held on our side, which keeps us
   * clear of promising a room we cannot guarantee. Event ticketing is a
   * separate flow and is unaffected by this flag.
   */
  directBooking: false,
} as const;
