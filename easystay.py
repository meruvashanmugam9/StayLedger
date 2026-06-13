#!/usr/bin/env python3
"""
EasyStay PG Accommodation Hostel Management System
Converted entirely to Python 3 with terminal user interface,
local JSON database persistence, interactive dashboards, and pro-rata utility calculation engines.

Licensed under Apache-2.0
"""

import json
import os
import sys
from datetime import datetime
from uuid import uuid4

# File database path for local persistence
DB_FILE = "easystay_db.json"


# ==========================================
# CONSTANTS & METADATA
# ==========================================
ROOM_TYPES = ["Single", "Double", "Triple", "Four-Sharing", "Five-Sharing"]
UTILITY_PLANS = ["Fixed", "Shared", "Metered"]
PAYMENT_TYPES = ["Rent", "Utility"]
PAYMENT_STATUSES = ["Paid", "Unpaid", "Overdue"]


# ==========================================
# INITIAL TEMPLATE DATA (REPRESENTED IN RUPEES - ₹)
# ==========================================
INITIAL_ROOMS = [
    {
        "id": "r1",
        "roomNumber": "101",
        "type": "Single",
        "rentPrice": 5500,
        "utilityType": "Fixed",
        "fixedUtilityAmount": 500,
        "capacity": 1,
        "status": "Full"
    },
    {
        "id": "r2",
        "roomNumber": "102",
        "type": "Double",
        "rentPrice": 3800,
        "utilityType": "Shared",
        "capacity": 2,
        "status": "Available"
    },
    {
        "id": "r3",
        "roomNumber": "201",
        "type": "Double",
        "rentPrice": 4000,
        "utilityType": "Shared",
        "capacity": 2,
        "status": "Available"
    },
    {
        "id": "r4",
        "roomNumber": "202",
        "type": "Triple",
        "rentPrice": 2800,
        "utilityType": "Fixed",
        "fixedUtilityAmount": 300,
        "capacity": 3,
        "status": "Available"
    },
    {
        "id": "r5",
        "roomNumber": "301",
        "type": "Single",
        "rentPrice": 6000,
        "utilityType": "Metered",
        "capacity": 1,
        "status": "Maintenance"
    },
    {
        "id": "r6",
        "roomNumber": "702",
        "type": "Four-Sharing",
        "rentPrice": 7000,
        "utilityType": "Shared",
        "capacity": 4,
        "status": "Available"
    },
    {
        "id": "r7",
        "roomNumber": "1002",
        "type": "Five-Sharing",
        "rentPrice": 6500,
        "utilityType": "Shared",
        "capacity": 5,
        "status": "Available"
    }
]

INITIAL_GUESTS = [
    {
        "id": "g1",
        "name": "Alexander Wright",
        "phone": "+91 98765 43210",
        "email": "alex.wright@example.com",
        "roomId": "r1",
        "checkInDate": "2026-01-10",
        "depositPaid": 5000,
        "status": "Active"
    },
    {
        "id": "g2",
        "name": "Sophia Martinez",
        "phone": "+91 87654 32109",
        "email": "sophia.m@example.com",
        "roomId": "r2",
        "checkInDate": "2026-02-15",
        "depositPaid": 4000,
        "status": "Active"
    },
    {
        "id": "g3",
        "name": "Liam Chen",
        "phone": "+91 76543 21098",
        "email": "lchen@example.com",
        "roomId": "r3",
        "checkInDate": "2026-03-01",
        "depositPaid": 4000,
        "status": "Active"
    },
    {
        "id": "g4",
        "name": "Emma Watson",
        "phone": "+91 65432 10987",
        "email": "emma@example.com",
        "roomId": "r3",
        "checkInDate": "2026-04-12",
        "depositPaid": 4500,
        "status": "Active"
    }
]

INITIAL_PAYMENTS = [
    {
        "id": "p1",
        "guestId": "g1",
        "guestName": "Alexander Wright",
        "roomNumber": "101",
        "type": "Rent",
        "amount": 5500,
        "billingPeriod": "June 2026",
        "dueDate": "2026-06-05",
        "status": "Unpaid",
        "description": "Monthly room rent"
    },
    {
        "id": "p2",
        "guestId": "g1",
        "guestName": "Alexander Wright",
        "roomNumber": "101",
        "type": "Utility",
        "amount": 500,
        "billingPeriod": "June 2026",
        "dueDate": "2026-06-05",
        "status": "Unpaid",
        "description": "Fixed Utility (Power & Water)"
    },
    {
        "id": "p3",
        "guestId": "g2",
        "guestName": "Sophia Martinez",
        "roomNumber": "102",
        "type": "Rent",
        "amount": 3800,
        "billingPeriod": "June 2026",
        "dueDate": "2026-06-05",
        "status": "Paid",
        "paidDate": "2026-06-01",
        "description": "Monthly room rent"
    },
    {
        "id": "p4",
        "guestId": "g3",
        "guestName": "Liam Chen",
        "roomNumber": "201",
        "type": "Rent",
        "amount": 4000,
        "billingPeriod": "June 2026",
        "dueDate": "2026-06-05",
        "status": "Paid",
        "paidDate": "2026-06-02",
        "description": "Monthly room rent"
    },
    {
        "id": "p5",
        "guestId": "g4",
        "guestName": "Emma Watson",
        "roomNumber": "201",
        "type": "Rent",
        "amount": 4000,
        "billingPeriod": "June 2026",
        "dueDate": "2026-06-05",
        "status": "Unpaid",
        "description": "Monthly room rent"
    },
    # History
    {
        "id": "p6",
        "guestId": "g1",
        "guestName": "Alexander Wright",
        "roomNumber": "101",
        "type": "Rent",
        "amount": 5500,
        "billingPeriod": "May 2026",
        "dueDate": "2026-05-05",
        "paidDate": "2026-05-04",
        "status": "Paid",
        "description": "Monthly room rent"
    },
    {
        "id": "p7",
        "guestId": "g1",
        "guestName": "Alexander Wright",
        "roomNumber": "101",
        "type": "Utility",
        "amount": 500,
        "billingPeriod": "May 2026",
        "dueDate": "2026-05-05",
        "paidDate": "2026-05-04",
        "status": "Paid",
        "description": "Fixed Utility (Power & Water)"
    },
    {
        "id": "p8",
        "guestId": "g2",
        "guestName": "Sophia Martinez",
        "roomNumber": "102",
        "type": "Rent",
        "amount": 3800,
        "billingPeriod": "May 2026",
        "dueDate": "2026-05-05",
        "paidDate": "2026-05-02",
        "status": "Paid",
        "description": "Monthly rent"
    },
    {
        "id": "p9",
        "guestId": "g3",
        "guestName": "Liam Chen",
        "roomNumber": "201",
        "type": "Rent",
        "amount": 4000,
        "billingPeriod": "May 2026",
        "dueDate": "2026-05-05",
        "paidDate": "2026-05-05",
        "status": "Paid",
        "description": "Monthly rent"
    }
]


# ==========================================
# UTILITY HELPER METHODS
# ==========================================
def clear_screen():
    os.system("cls" if os.name == "nt" else "clear")


def get_room_share_label(room):
    t = room["type"]
    if t == "Single":
        return "1 Share"
    elif t == "Double":
        return "2 Share"
    elif t == "Triple":
        return "3 Share"
    elif t == "Four-Sharing":
        return "4 Share"
    elif t == "Five-Sharing":
        return "5 Share"
    return t


def show_title():
    print("=" * 64)
    print("               EASYSTAY PG ACCOMMODATION MANAGER            ")
    print("                 [ Complete Python Version ]                ")
    print("=" * 64)


def read_choice(prompt, start_num, end_num):
    while True:
        try:
            val = input(prompt).strip()
            if not val:
                return None
            num = int(val)
            if start_num <= num <= end_num:
                return num
            print(f"Error: Choice must be between {start_num} and {end_num}.")
        except ValueError:
            print("Error: Please provide a valid integer index.")


# ==========================================
# SYSTEM DATA CONTROL CONTROLLER CLASS
# ==========================================
class EasyStayDB:
    def __init__(self):
        self.rooms = []
        self.guests = []
        self.payments = []
        self.load()

    def load(self):
        if os.path.exists(DB_FILE):
            try:
                with open(DB_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.rooms = data.get("rooms", INITIAL_ROOMS)
                    self.guests = data.get("guests", INITIAL_GUESTS)
                    self.payments = data.get("payments", INITIAL_PAYMENTS)
            except Exception as e:
                print(f"Failed to load user state: {e}. Resetting with mock data.")
                self.reset_mock()
        else:
            self.reset_mock()

    def save(self):
        try:
            with open(DB_FILE, "w", encoding="utf-8") as f:
                json.dump({
                    "rooms": self.rooms,
                    "guests": self.guests,
                    "payments": self.payments
                }, f, indent=2)
        except Exception as e:
            print(f"Error persisting data to local JSON disk: {e}")

    def reset_mock(self):
        self.rooms = json.loads(json.dumps(INITIAL_ROOMS))
        self.guests = json.loads(json.dumps(INITIAL_GUESTS))
        self.payments = json.loads(json.dumps(INITIAL_PAYMENTS))
        self.save()


# ==========================================
# CONTROLLER & VIEWS DEMUX
# ==========================================
class EasyStayApp:
    def __init__(self):
        self.db = EasyStayDB()

    def run(self):
        while True:
            clear_screen()
            show_title()
            self.show_dashboard_stats()
            print()
            print("1. [Rooms] Manage PG Dorms & Sharing Structures")
            print("2. [Guests] Tenant Registrations & Check-Ins")
            print("3. [Payments] Billing Ledger & Cash Collection")
            print("4. [Utility Splitter] Distribute Common Bills (Pro-Rata/Equal)")
            print("5. [Reset Template] Clear Database to Default Mock Values")
            print("6. Exit EasyStay Operator Console")
            print("-" * 64)

            ch = read_choice("Enter command index (1-6): ", 1, 6)
            if ch == 1:
                self.menu_rooms()
            elif ch == 2:
                self.menu_guests()
            elif ch == 3:
                self.menu_payments()
            elif ch == 4:
                self.menu_utility_splitter()
            elif ch == 5:
                self.reset_system()
            elif ch == 6 or ch is None:
                print("\nThank you for using EasyStay. Goodbye!\n")
                break

    def show_dashboard_stats(self):
        # Occupancy Math
        active_guests = [g for g in self.db.guests if g["status"] == "Active"]
        total_beds = sum(r["capacity"] for r in self.db.rooms if r["status"] != "Maintenance")
        filled_beds = len(active_guests)
        occupancy_rate = (filled_beds / total_beds * 100) if total_beds > 0 else 0

        # Receivable Financials
        unpaid_bills = [p for p in self.db.payments if p["status"] in ["Unpaid", "Overdue"]]
        total_unpaid_amount = sum(b["amount"] for b in unpaid_bills)

        total_rooms = len(self.db.rooms)
        maintenance_rooms = len([r for r in self.db.rooms if r["status"] == "Maintenance"])

        print(":: LIVE SYSTEM STANDING METRICS ::")
        print(f"  * PG Occupancy Load    : {filled_beds} Active Occupants / {total_beds} Total Live Beds ({occupancy_rate:.1f}%)")
        print(f"  * Accounts Receivable  : ₹{total_unpaid_amount:,} Due (Unpaid / Overdue Ledgers)")
        print(f"  * Physical PG Rooms    : {total_rooms} Rooms ({maintenance_rooms} in Maintenance Mode)")

    def reset_system(self):
        confirm = input("Are you sure you want to clear custom edits and restore default datasets? (y/N): ").strip().lower()
        if confirm == 'y':
            self.db.reset_mock()
            print("\nDatabase reset successful!")
            input("Press Enter to continue...")

    # ==========================================
    # ROOMS SECTION
    # ==========================================
    def menu_rooms(self):
        while True:
            clear_screen()
            print("================================================================")
            print("                   PHYSICAL PG ROOMS MANAGER                    ")
            print("================================================================")
            
            # Print physical rooms neatly
            print(f"{'No.':<4} {'Room':<8} {'Type':<15} {'Base Price':<12} {'Utility Plan':<15} {'Status':<12} {'Occupancy':<10}")
            print("-" * 80)
            for i, room in enumerate(self.db.rooms):
                r_id = room["id"]
                occupied_count = len([g for g in self.db.guests if g["roomId"] == r_id and g["status"] == "Active"])
                occ_str = f"{occupied_count}/{room['capacity']} Beds"
                
                util_desc = room["utilityType"]
                if room["utilityType"] == "Fixed":
                    util_desc += f" (₹{room['fixedUtilityAmount']:.0f})"

                fmt_type = f"{room['type']} ({get_room_share_label(room)})"
                status_lbl = room["status"]
                if occupied_count >= room["capacity"] and status_lbl == "Available":
                    status_lbl = "Full"

                print(f"{i+1:<4} {room['roomNumber']:<8} {fmt_type:<15} ₹{room['rentPrice']:<11} {util_desc:<15} {status_lbl:<12} {occ_str:<10}")

            print("-" * 80)
            print("1. Add New PG Room Structure")
            print("2. Edit Existing Room Parameters")
            print("3. Return to Main Dashboard")

            ch = read_choice("Choose task option (1-3): ", 1, 3)
            if ch == 1:
                self.add_room()
            elif ch == 2:
                self.edit_room()
            elif ch == 3 or ch is None:
                break

    def add_room(self):
        print("\n:: REGISTER NEW ROOM ENTRY ::")
        no = input("Room Number / Code (e.g. 702, 1002): ").strip()
        if not no:
            print("Cancelled.")
            return
        
        # Duplicity test
        if any(r["roomNumber"].lower() == no.lower() for r in self.db.rooms):
            print("Error: Room already exists with that identifier.")
            input("Press Enter to abort...")
            return

        print("\nRoom Sharing Tiers:")
        for idx, t in enumerate(ROOM_TYPES):
            print(f"  {idx+1}. {t}")
        sch = read_choice("Select tier matching (1-5): ", 1, 5)
        room_type = ROOM_TYPES[sch - 1]
        
        # Translate capacity
        capacity_map = {"Single": 1, "Double": 2, "Triple": 3, "Four-Sharing": 4, "Five-Sharing": 5}
        capacity = capacity_map.get(room_type, 5)

        default_rent = 4050.0
        if room_type == "Four-Sharing":
            default_rent = 7000.0
        elif room_type == "Five-Sharing":
            default_rent = 6500.0

        try:
            r_input = input(f"Monthly Rent per Bed (₹) [Default {default_rent}]: ").strip()
            rent = float(r_input) if r_input else default_rent
        except ValueError:
            rent = default_rent

        print("\nUtility Schemes:")
        for idx, p in enumerate(UTILITY_PLANS):
            print(f"  {idx+1}. {p}")
        uch = read_choice("Select Utility Plan matching (1-3): ", 1, 3)
        util_type = UTILITY_PLANS[uch - 1]

        fixed_amt = None
        if util_type == "Fixed":
            try:
                fixed_amt = float(input("Fixed Monthly Utility Amount (₹): ").strip())
            except ValueError:
                fixed_amt = 300.0

        new_room = {
            "id": "room_" + str(int(datetime.now().timestamp())),
            "roomNumber": no,
            "type": room_type,
            "rentPrice": rent,
            "utilityType": util_type,
            "fixedUtilityAmount": fixed_amt,
            "capacity": capacity,
            "status": "Available"
        }
        self.db.rooms.append(new_room)
        self.db.save()
        print(f"\nSuccess! Room {no} registered with {capacity} shares capacity.")
        input("Press Enter to continue...")

    def edit_room(self):
        print("\n:: CUSTOMIZE EXISTING ROOM STRUCTURES ::")
        if not self.db.rooms:
            print("No rooms to edit.")
            input("Press Enter...")
            return

        sch = read_choice(f"Enter room row index to edit (1-{len(self.db.rooms)}): ", 1, len(self.db.rooms))
        if sch is None:
            return
        
        room = self.db.rooms[sch - 1]
        print(f"\nModifying Room: {room['roomNumber']} ({room['type']})")

        new_no = input(f"New Room Number [Press enter to keep '{room['roomNumber']}']: ").strip()
        if new_no:
            # Check duplication
            if any(r["roomNumber"].strip().lower() == new_no.lower() and r["id"] != room["id"] for r in self.db.rooms):
                print("Error: Room number conflict inside ledger directory.")
                input("Press Enter to abort...")
                return
            room["roomNumber"] = new_no

        print("\nRoom Sharing Format Options:")
        for idx, t in enumerate(ROOM_TYPES):
            print(f"  {idx+1}. {t}")
        print(f"  [Present: {room['type']}]")
        sch_t = input("Select format option index (or press enter to skip): ").strip()
        if sch_t:
            try:
                tier_idx = int(sch_t)
                if 1 <= tier_idx <= 5:
                    room["type"] = ROOM_TYPES[tier_idx - 1]
                    capacity_map = {"Single": 1, "Double": 2, "Triple": 3, "Four-Sharing": 4, "Five-Sharing": 5}
                    room["capacity"] = capacity_map.get(room["type"], 5)
                    if room["type"] == "Four-Sharing":
                        room["rentPrice"] = 7000.0
                    elif room["type"] == "Five-Sharing":
                        room["rentPrice"] = 6500.0
            except ValueError:
                pass

        new_rent = input(f"New Monthly Rent per Bed [Present: ₹{room['rentPrice']:}]: ").strip()
        if new_rent:
            try:
                room["rentPrice"] = float(new_rent)
            except ValueError:
                pass

        print("\nUtility Plan Options:")
        for idx, p in enumerate(UTILITY_PLANS):
            print(f"  {idx+1}. {p}")
        print(f"  [Present: {room['utilityType']}]")
        sch_u = input("Select plan option index (or press enter to skip): ").strip()
        if sch_u:
            try:
                plan_idx = int(sch_u)
                if 1 <= plan_idx <= 3:
                    room["utilityType"] = UTILITY_PLANS[plan_idx - 1]
            except ValueError:
                pass

        if room["utilityType"] == "Fixed":
            pres_fixed = room.get("fixedUtilityAmount", 300)
            new_fixed = input(f"Fixed Monthly Utility Amount [Present: ₹{pres_fixed}]: ").strip()
            if new_fixed:
                try:
                    room["fixedUtilityAmount"] = float(new_fixed)
                except ValueError:
                    pass
        else:
            room.pop("fixedUtilityAmount", None)

        print("\nPhysical Status Configuration:")
        statuses = ["Available", "Maintenance"]
        for idx, st in enumerate(statuses):
            print(f"  {idx+1}. {st}")
        print(f"  [Present: {room['status']}]")
        sch_st = input("Select status code index (or press enter to skip): ").strip()
        if sch_st:
            try:
                status_idx = int(sch_st)
                if 1 <= status_idx <= 2:
                    room["status"] = statuses[status_idx - 1]
            except ValueError:
                pass

        self.db.save()
        print(f"\nRoom {room['roomNumber']} details upgraded successfully.")
        input("Press Enter...")


    # ==========================================
    # GUESTS / CHECK-IN SECTION
    # ==========================================
    def menu_guests(self):
        while True:
            clear_screen()
            print("================================================================")
            print("                 TENANTS REGISTER & CHECK-IN                    ")
            print("================================================================")

            print(f"{'No.':<4} {'Tenant Name':<20} {'Phone':<15} {'Room Assigned':<18} {'Check-In Date':<15} {'Status':<10}")
            print("-" * 85)
            for i, guest in enumerate(self.db.guests):
                # Format room label
                r_id = guest["roomId"]
                room = next((r for r in self.db.rooms if r["id"] == r_id), None)
                if room:
                    sh_lbl = get_room_share_label(room)
                    assigned_str = f"Room {room['roomNumber']} ({sh_lbl})"
                else:
                    assigned_str = "N/A"

                print(f"{i+1:<4} {guest['name']:<20} {guest['phone']:<15} {assigned_str:<18} {guest['checkInDate']:<15} {guest['status']:<10}")

            print("-" * 85)
            print("1. Register Tenant (Check-In Single Active Room)")
            print("2. Edit Tenant Details & Place Assigned Room")
            print("3. Check-Out Guest (Liberate Bed occupancy)")
            print("4. Return to Main Dashboard")

            ch = read_choice("Choose task option (1-4): ", 1, 4)
            if ch == 1:
                self.check_in_guest()
            elif ch == 2:
                self.edit_guest()
            elif ch == 3:
                self.checkout_guest()
            elif ch == 4 or ch is None:
                break

    def get_available_rooms(self):
        available = []
        for room in self.db.rooms:
            if room["status"] == "Maintenance":
                continue
            # Calculate loaded beds
            active_load_count = len([g for g in self.db.guests if g["roomId"] == room["id"] and g["status"] == "Active"])
            if active_load_count < room["capacity"]:
                available.append((room, room["capacity"] - active_load_count))
        return available

    def check_in_guest(self):
        print("\n:: TENANT WELCOME REGISTRATION ::")
        name = input("Enter Full Name *: ").strip()
        if not name:
            print("Cancelled.")
            return

        phone = input("WhatsApp / Contact No *: ").strip()
        email = input("Email Address: ").strip() or "tenant@example.com"
        
        # Check-in date default to today
        today = datetime.now().strftime("%Y-%m-%d")
        ci_date = input(f"Check-In Date [default {today}]: ").strip() or today

        try:
            deposit = float(input("Safety Security Deposit Paid (₹) [default 3000]: ").strip() or "3000")
        except ValueError:
            deposit = 3000.0

        # Query options for rooms
        avail_rooms = self.get_available_rooms()

        print("\nHow would you like to assign a bed?")
        print("  1. Select from Vacant Beds List")
        print("  2. Construct a new custom Room structure on-the-fly")
        assign_ch = read_choice("Select layout path: ", 1, 2)

        assigned_room_id = None

        if assign_ch == 2 or not avail_rooms:
            if not avail_rooms:
                print("\n[NOTICE] No vacant beds remaining! Launching dynamic custom room designer...")
            
            print("\n:: DYNAMIC CUSTOM ROOM SETUP ON THE FLY ::")
            while True:
                c_no = input("Design New Room Number / Block: ").strip()
                if not c_no:
                    print("Error: Desired room number cannot be left blank.")
                    continue
                # duplicity check
                if any(r["roomNumber"].lower() == c_no.lower() for r in self.db.rooms):
                    print("That room number is already defined. Please choose another unique number.")
                    continue
                break

            print("\nSetup sharing options:")
            for idx, t in enumerate(ROOM_TYPES):
                print(f"  {idx+1}. {t}")
            sch_t = read_choice("Format choice index (1-5): ", 1, 5)
            c_type = ROOM_TYPES[sch_t - 1]
            capacity_map = {"Single": 1, "Double": 2, "Triple": 3, "Four-Sharing": 4, "Five-Sharing": 5}
            c_cap = capacity_map.get(c_type, 5)

            default_rent = 4050.0
            if c_type == "Four-Sharing":
                default_rent = 7000.0
            elif c_type == "Five-Sharing":
                default_rent = 6500.0

            try:
                c_rent_input = input(f"Monthly Rent per Bed (₹) [Default {default_rent}]: ").strip()
                c_rent = float(c_rent_input) if c_rent_input else default_rent
            except ValueError:
                c_rent = default_rent

            print("\nUtility Scheme:")
            for idx, p in enumerate(UTILITY_PLANS):
                print(f"  {idx+1}. {p}")
            uch = read_choice("Option matching plan (1-3): ", 1, 3)
            c_util = UTILITY_PLANS[uch - 1]

            c_fixed = None
            if c_util == "Fixed":
                try:
                    c_fixed = float(input("Fixed Monthly Utility Amount (₹): ").strip())
                except ValueError:
                    c_fixed = 300.0

            # Register on-the-fly room
            new_room_id = "vroom_" + str(int(datetime.now().timestamp()))
            self.db.rooms.append({
                "id": new_room_id,
                "roomNumber": c_no,
                "type": c_type,
                "rentPrice": c_rent,
                "utilityType": c_util,
                "fixedUtilityAmount": c_fixed,
                "capacity": c_cap,
                "status": "Available"
            })
            assigned_room_id = new_room_id
            print(f"Constructed Room {c_no} successfully on directory map.")
        else:
            print("\nAvailable Vacancies:")
            for idx, (r, beds_left) in enumerate(avail_rooms):
                sh_lbl = get_room_share_label(r)
                print(f"  {idx+1}. Room {r['roomNumber']} ({sh_lbl} - ₹{r['rentPrice']}/mo, {beds_left} beds left)")
            
            sel = read_choice(f"Assign to vacancy row (1-{len(avail_rooms)}): ", 1, len(avail_rooms))
            if sel is None:
                print("Registration failed/aborted.")
                return
            assigned_room_id = avail_rooms[sel - 1][0]["id"]

        # Register Guest
        new_g_id = "guest_" + str(int(datetime.now().timestamp()))
        new_guest = {
            "id": new_g_id,
            "name": name,
            "phone": phone,
            "email": email,
            "roomId": assigned_room_id,
            "checkInDate": ci_date,
            "depositPaid": deposit,
            "status": "Active"
        }
        self.db.guests.append(new_guest)

        # Retrieve room details for auto-billing
        target_room = next(r for r in self.db.rooms if r["id"] == assigned_room_id)

        # Auto billing
        autobill = input("\nGenerate initial Month 1 bills automatically into Ledger? (Y/n): ").strip().lower()
        if autobill != 'n':
            curr_period = datetime.now().strftime("%B %Y")
            due_date = datetime.now().strftime("%Y-%m-10")

            # Rent ledger invoice
            rent_payment = {
                "id": f"bill_{int(datetime.now().timestamp())}_r",
                "guestId": new_g_id,
                "guestName": name,
                "roomNumber": target_room["roomNumber"],
                "type": "Rent",
                "amount": target_room["rentPrice"],
                "billingPeriod": curr_period,
                "dueDate": due_date,
                "status": "Unpaid",
                "description": f"First Month rent: Room {target_room['roomNumber']}"
            }
            self.db.payments.append(rent_payment)

            # Utility fixed billing plan handles (if Fixed Plan active)
            if target_room["utilityType"] == "Fixed" and target_room.get("fixedUtilityAmount"):
                util_amt = target_room["fixedUtilityAmount"]
                util_payment = {
                    "id": f"bill_{int(datetime.now().timestamp())}_u",
                    "guestId": new_g_id,
                    "guestName": name,
                    "roomNumber": target_room["roomNumber"],
                    "type": "Utility",
                    "amount": util_amt,
                    "billingPeriod": curr_period,
                    "dueDate": due_date,
                    "status": "Unpaid",
                    "description": f"Fixed Utility: Power & Water share: {curr_period}"
                }
                self.db.payments.append(util_payment)
            
            print("Auto-bills mapped into current register.")

        self.db.save()
        print(f"\nWelcome onboard, {name}! Registered successfully.")
        input("Press Enter...")

    def edit_guest(self):
        print("\n:: CORRECTIONS TO REGISTRATION CARD ::")
        if not self.db.guests:
            print("No tenants registered.")
            input("Press Enter...")
            return

        row = read_choice(f"Select tenant row index to edit (1-{len(self.db.guests)}): ", 1, len(self.db.guests))
        if row is None:
            return
        
        guest = self.db.guests[row - 1]
        print(f"\nEditing card: {guest['name']}")

        new_name = input(f"New Name [Present: {guest['name']}]: ").strip()
        if new_name:
            guest["name"] = new_name
        
        new_phone = input(f"New WhatsApp [Present: {guest['phone']}]: ").strip()
        if new_phone:
            guest["phone"] = new_phone

        new_email = input(f"New Email [Present: {guest['email']}]: ").strip()
        if new_email:
            guest["email"] = new_email

        # Bed relocation rules
        print(f"\nRelocate Room Selection:")
        active_vacancies = self.get_available_rooms()
        curr_room = next((r for r in self.db.rooms if r["id"] == guest["roomId"]), None)
        
        all_choices = []
        if curr_room:
            all_choices.append(curr_room)
            print(f"  Current: Room {curr_room['roomNumber']} ({get_room_share_label(curr_room)})")

        for r, beds_left in active_vacancies:
            if curr_room and r["id"] == curr_room["id"]:
                continue
            all_choices.append(r)
            sh_lbl = get_room_share_label(r)
            print(f"  Vacancy: Room {r['roomNumber']} ({sh_lbl} - {beds_left} beds free)")

        print("Select room switch entry (or press enter to skip room transfer):")
        r_sel = input("Index number: ").strip()
        if r_sel:
            try:
                r_idx = int(r_sel)
                if 1 <= r_idx <= len(all_choices):
                    guest["roomId"] = all_choices[r_idx - 1]["id"]
                    print(f"Relocated to Room {all_choices[r_idx - 1]['roomNumber']}.")
            except ValueError:
                pass

        # Update in-place room description prompt
        target_room = next((r for r in self.db.rooms if r["id"] == guest["roomId"]), None)
        if target_room:
            print(f"\nWould you like to customize the features of this assigned room (Room {target_room['roomNumber']}) on-the-fly?")
            sh_edit = input("Edit assigned room particulars? (y/N): ").strip().lower()
            if sh_edit == 'y':
                print(f"Editing Room {target_room['roomNumber']} profile specs:")
                
                new_room_no = input(f"  Room Number [Present: {target_room['roomNumber']}]: ").strip()
                if new_room_no:
                    # Check duplication
                    if not any(r["roomNumber"].lower() == new_room_no.lower() and r["id"] != target_room["id"] for r in self.db.rooms):
                        target_room["roomNumber"] = new_room_no
                    else:
                        print("Room Number already in use by another bed.")

                print("\n  Room Format Type:")
                for idx, t in enumerate(ROOM_TYPES):
                    print(f"    {idx+1}. {t}")
                print(f"    [Present: {target_room['type']}]")
                t_sel = input("    Format index: ").strip()
                if t_sel:
                    try:
                        t_idx = int(t_sel)
                        if 1 <= t_idx <= 5:
                            target_room["type"] = ROOM_TYPES[t_idx - 1]
                            capacity_map = {"Single": 1, "Double": 2, "Triple": 3, "Four-Sharing": 4, "Five-Sharing": 5}
                            target_room["capacity"] = capacity_map.get(target_room["type"], 5)
                            if target_room["type"] == "Four-Sharing":
                                target_room["rentPrice"] = 7000.0
                            elif target_room["type"] == "Five-Sharing":
                                target_room["rentPrice"] = 6500.0
                    except ValueError:
                        pass

                new_rent = input(f"  Per Bed Rent [Present: ₹{target_room['rentPrice']}]: ").strip()
                if new_rent:
                    try:
                        target_room["rentPrice"] = float(new_rent)
                    except ValueError:
                        pass

                new_utils = input(f"  Utility Plan Choose Fixed Fee/Shared/Metered [Present: {target_room['utilityType']}]: ").strip()
                if new_utils and new_utils in UTILITY_PLANS:
                    target_room["utilityType"] = new_utils

        self.db.save()
        print("\nTenant ledger files saved successfully.")
        input("Press Enter...")

    def checkout_guest(self):
        print("\n:: SECURE TENANT DEPARTURE CHECKOUT ::")
        active_guests = [g for g in self.db.guests if g["status"] == "Active"]
        if not active_guests:
            print("There are no registered active tenants in the system.")
            input("Press Enter...")
            return

        for idx, g in enumerate(active_guests):
            r = next((rm for rm in self.db.rooms if rm["id"] == g["roomId"]), None)
            r_no = r["roomNumber"] if r else "Unassigned"
            print(f"  {idx+1}. {g['name']} (Room {r_no})")

        sel = read_choice(f"Select departure row (1-{len(active_guests)}): ", 1, len(active_guests))
        if sel is None:
            return

        target_guest = active_guests[sel - 1]
        
        # Calculate outstanding dues
        unpaid = [p for p in self.db.payments if p["guestId"] == target_guest["id"] and p["status"] in ["Unpaid", "Overdue"]]
        unpaid_sum = sum(p["amount"] for p in unpaid)

        print(f"\nDeparture Audit: {target_guest['name']}")
        print(f"  * Safety Cash Deposit Left  : ₹{target_guest['depositPaid']:,}")
        print(f"  * System Outstanding balance: ₹{unpaid_sum:,}")

        if unpaid_sum > 0:
            print("\nWARNING: This occupant yields outstanding unpaid bills! Clear them first or offset by security deposit.")
            cont = input("Liberate anyway? (y/N): ").strip().lower()
            if cont != 'y':
                return

        # Checkout
        origin_guest_record = next(g for g in self.db.guests if g["id"] == target_guest["id"])
        origin_guest_record["status"] = "CheckedOut"
        self.db.save()

        print(f"\n{target_guest['name']} checked out successfully. PG Bed released back to queue.")
        input("Press Enter...")


    # ==========================================
    # PAYMENTS SECTION
    # ==========================================
    def menu_payments(self):
        while True:
            clear_screen()
            print("================================================================")
            print("                CASH FLOWS & SYSTEM LEDGER                      ")
            print("================================================================")

            # Filter or List all invoices
            print(f"{'No.':<4} {'Tenant Name':<18} {'Room':<6} {'Invoice':<8} {'Amount':<10} {'Period':<12} {'Due Date':<12} {'Status':<8}")
            print("-" * 85)
            for i, p in enumerate(self.db.payments):
                print(f"{i+1:<4} {p['guestName']:<18} {p['roomNumber']:<6} {p['type']:<8} ₹{p['amount']:<9} {p['billingPeriod']:<12} {p['dueDate']:<12} {p['status']:<8}")

            print("-" * 85)
            print("1. Pay Due Bill Invoice (Mark Payment Received)")
            print("2. Levy Custom Invoice Fee Onto Tenant Ledger")
            print("3. Return to Main Dashboard")

            ch = read_choice("Choose task option (1-3): ", 1, 3)
            if ch == 1:
                self.collect_payment()
            elif ch == 2:
                self.levy_manual_fee()
            elif ch == 3 or ch is None:
                break

    def collect_payment(self):
        print("\n:: REALIZE CASH TRANSACTION ::")
        active_unpaid = [p for p in self.db.payments if p["status"] in ["Unpaid", "Overdue"]]
        if not active_unpaid:
            print("Outstanding accounts healthy! No pending ledger entries to process.")
            input("Press Enter to continue...")
            return

        for idx, p in enumerate(active_unpaid):
            print(f"  {idx+1}. {p['guestName']} (Room {p['roomNumber']}) - {p['type']} in {p['billingPeriod']} : ₹{p['amount']:,}")

        sel = read_choice(f"Assign transaction row index (1-{len(active_unpaid)}): ", 1, len(active_unpaid))
        if sel is None:
            return

        target_payment = active_unpaid[sel - 1]
        
        # Mark as Paid
        today = datetime.now().strftime("%Y-%m-%d")
        pay_date = input(f"Payment Date Received [default {today}]: ").strip() or today

        # Modify inside DB
        matched = next(p for p in self.db.payments if p["id"] == target_payment["id"])
        matched["status"] = "Paid"
        matched["paidDate"] = pay_date

        self.db.save()
        clear_screen()
        print("\n" + "=" * 50)
        print("                 OFFICIAL PAYMENT RECEIPT               ")
        print("=" * 50)
        print(f"Receipt ID     : {matched['id'].upper()}")
        print(f"Received From  : {matched['guestName']}")
        print(f"Room Allocated : {matched['roomNumber']}")
        print(f"Charge Heading : {matched['type']} Fee ({matched.get('description', '')})")
        print(f"Time Frame     : {matched['billingPeriod']}")
        print(f"Amount Settled : ₹{matched['amount']:,}.00")
        print(f"Clearing Date  : {pay_date}")
        print("=" * 50)
        print("Status Code    : SUCCESS / PAID - NO BALANCE DUE")
        print("=" * 50)
        input("\nReceipt generated. Press Enter to return...")

    def levy_manual_fee(self):
        print("\n:: LEVY CUSTOM BILLING ENTITY ::")
        active_tenants = [g for g in self.db.guests if g["status"] == "Active"]
        if not active_tenants:
            print("No active tenants registered in system files.")
            input("Press Enter...")
            return

        for idx, g in enumerate(active_tenants):
            r = next((rm for rm in self.db.rooms if rm["id"] == g["roomId"]), None)
            r_no = r["roomNumber"] if r else "Unassigned"
            print(f"  {idx+1}. {g['name']} (Room {r_no})")

        sel = read_choice(f"Target tenant row (1-{len(active_tenants)}): ", 1, len(active_tenants))
        if sel is None:
            return

        guest = active_tenants[sel - 1]
        r_item = next((rm for rm in self.db.rooms if rm["id"] == guest["roomId"]), None)
        r_no = r_item["roomNumber"] if r_item else "N/A"

        print(f"\nCreating debit entry for: {guest['name']}")
        print("Choose charge category type:")
        print("  1. Rent Fee Invoice")
        print("  2. Utility Bill Invoice")
        type_ch = read_choice("Category Code: ", 1, 2)
        p_type = "Rent" if type_ch == 1 else "Utility"

        try:
            amt = float(input("Billing Amount (₹): ").strip())
        except ValueError:
            print("Aborted. Invalid numerical invoice value.")
            return

        period = input("Enter Billing Period Name (e.g. June 2026): ").strip() or datetime.now().strftime("%B %Y")
        due = input("Enter Compliance Due Date (YYYY-MM-DD): ").strip() or datetime.now().strftime("%Y-%m-10")
        desc = input("Narrative annotation: ").strip() or f"Manual {p_type} entry"

        new_invoice = {
            "id": f"manual_bill_{int(datetime.now().timestamp())}",
            "guestId": guest["id"],
            "guestName": guest["name"],
            "roomNumber": r_no,
            "type": p_type,
            "amount": amt,
            "billingPeriod": period,
            "dueDate": due,
            "status": "Unpaid",
            "description": desc
        }
        self.db.payments.append(new_invoice)
        self.db.save()

        print(f"\nDebited ₹{amt:,} successfully inside the PG System Ledger.")
        input("Press Enter...")


    # ==========================================
    # SMART UTILITY BILL SPLITTER
    # ==========================================
    def menu_utility_splitter(self):
        clear_screen()
        print("==================================================================")
        print("                   SMART UTILITY BILLS SPLITTER                   ")
        print("==================================================================")
        print("Split core expenses from building electricity, gas or internet")
        print("receipts fairly among active occupants based on two standard rules.")
        print()

        active_guests = [g for g in self.db.guests if g["status"] == "Active"]
        active_guests_count = len(active_guests)

        if active_guests_count == 0:
            print("[NOTICE] No active tenants checked in. Cannot run calculations.")
            input("Press Enter...")
            return

        print(f"Current System Census: {active_guests_count} Active Occupants present.")
        
        try:
            total_invoice = float(input("\nEnter Master Bill Receivable Amount (₹) *: ").strip())
        except ValueError:
            print("Cancelled. Amount must be a positive decimal.")
            return

        print("\nSpecify Utility Heading:")
        h_types = ["Electricity", "Water", "Gas", "Internet", "Trash", "Other"]
        for idx, u in enumerate(h_types):
            print(f"  {idx+1}. {u}")
        u_sel = read_choice("Option code row (1-6): ", 1, 6)
        utility_heading = h_types[(u_sel or 1) - 1]

        period = input("Billing Period name (e.g. June 2026): ").strip() or datetime.now().strftime("%B %Y")
        due_date = input("Due Date for Payments (YYYY-MM-DD): ").strip() or datetime.now().strftime("%Y-%m-10")

        print("\nChoose Split Allocation math model:")
        print("  1. Equal Split among all Tenant heads (Pure Headcount)")
        print("  2. Split by Room count first, then divided per bed occupants")
        alg_ch = read_choice("Allocation Model Choice (1-2): ", 1, 2)

        splits = []

        if alg_ch == 1:
            # Absolute headcount split
            each_guest_due = round(total_invoice / active_guests_count, 2)
            print(f"\nHeadcount Calculation Preview (Cost/Tenant: ₹{each_guest_due:,}):")
            for g in active_guests:
                r_item = next((r for r in self.db.rooms if r["id"] == g["roomId"]), None)
                r_no = r_item["roomNumber"] if r_item else "Unknown"
                splits.append({
                    "guestId": g["id"],
                    "guestName": g["name"],
                    "roomNumber": r_no,
                    "amount": each_guest_due,
                    "description": f"{utility_heading} Split: Equal Pro-Capita share"
                })
        else:
            # Occupied room division split
            occupied_room_ids = list(set(g["roomId"] for g in active_guests))
            occupied_rooms_count = len(occupied_room_ids)

            if occupied_rooms_count == 0:
                print("No occupied rooms mapped.")
                input("Press Enter...")
                return

            each_room_due = total_invoice / occupied_rooms_count
            print(f"\nPro-Rata Room Occupancy Preview:")
            print(f"  * Occupied Rooms Listed: {occupied_rooms_count}")
            print(f"  * Cost distributed/room: ₹{each_room_due:,}")

            for g in active_guests:
                # Count current co-sharers inside same room
                siblings = len([sib for sib in active_guests if sib["roomId"] == g["roomId"]])
                share_of_room = round(each_room_due / siblings, 2)
                
                r_item = next((r for r in self.db.rooms if r["id"] == g["roomId"]), None)
                r_no = r_item["roomNumber"] if r_item else "Unknown"
                splits.append({
                    "guestId": g["id"],
                    "guestName": g["name"],
                    "roomNumber": r_no,
                    "amount": share_of_room,
                    "description": f"{utility_heading} Split: Room Share/Occupants limit ({siblings} beds inside {r_no})"
                })

        # List preview calculation tables
        print("-" * 65)
        print(f"{'Tenant':<22} {'Room':<8} {'Narrative':<24} {'Share Due (₹)':<10}")
        print("-" * 65)
        for item in splits:
            print(f"{item['guestName']:<22} {item['roomNumber']:<8} {item['description'][:22]:<24} ₹{item['amount']:<10,}")
        print("-" * 65)

        publish = input("\nCommit calculations & publish bills to Tenant Ledger profiles? (y/N): ").strip().lower()
        if publish == 'y':
            for i, split in enumerate(splits):
                new_receipt = {
                    "id": f"split_{int(datetime.now().timestamp())}_{i}",
                    "guestId": split["guestId"],
                    "guestName": split["guestName"],
                    "roomNumber": split["roomNumber"],
                    "type": "Utility",
                    "amount": split["amount"],
                    "billingPeriod": period,
                    "dueDate": due_date,
                    "status": "Unpaid",
                    "description": f"{utility_heading} Invoice: {period}"
                }
                self.db.payments.append(new_receipt)
            self.db.save()
            print("\nSplitting routine complete. Bills appended to Ledger Directory.")
        else:
            print("\nCancelled Calculations.")
        
        input("Press Enter...")


# ==========================================
# BOOT EXECUTION TRIGGER
# ==========================================
if __name__ == "__main__":
    app = EasyStayApp()
    app.run()
