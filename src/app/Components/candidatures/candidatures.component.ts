import { Component, Inject } from "@angular/core"
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog"
import { MatTableDataSource } from "@angular/material/table"
import { ActivatedRoute } from "@angular/router"
import { Candidature } from "src/app/Data/Candidature"
import { CandidatureService } from "src/app/Services/fn/candidature/candidature.service"
import { ExportToCsv } from "export-to-csv"
import { ChallengeService } from "src/app/Services/fn/challenge/challenge-service.service"
import { CodingChallenge } from "src/app/Data/coding-challenge.model"

@Component({
  selector: "app-candidatures",
  templateUrl: "./candidatures.component.html",
  styleUrls: ["./candidatures.component.css"],
})
export class CandidaturesComponent {
  candidatures: Candidature[] = []
  pagedCandidatures: Candidature[] = [] // This is what your template uses
  allCandidatures: Candidature[] = []
  challenges: CodingChallenge[] = []

  totalPages = 0
  totalItems = 0
  currentPage = 0
  pageSize = 10
  loading = false

  // Other properties...
  editingId: number | null = null
  isModalOpen = false
  fullUrl: string | null = null
  selectedStatus = ""

  datatableColumns = [
    { name: "Nom du candidat", prop: "nom", sortable: true },
    { name: "Email", prop: "email", sortable: true },
    { name: "Titre de l'offre", prop: "offreEmploi.titre", sortable: true },
    { name: "Actions", prop: "actions", sortable: false },
    { name: "Statut", prop: "statut", sortable: true },
  ]

  selectedRows: any[] = []
  globalFilterValue = ""
  statusFilterValue = ""
  dataSource = new MatTableDataSource<Candidature>()
  viewMode: "table" | "card" = "table"
  showModal = false
  showSendChallengeModal = false
  selectedCandidature: Candidature | null = null
  showCandidatureFilterBar = false

  candidatureFilters = {
    applicationStatus: "all",
    challengeStatus: "all",
    scoreRange: "all",
  }

  constructor(
    public candidatureService: CandidatureService,
    public route: ActivatedRoute,
    private dialog: MatDialog,
    private challengeService: ChallengeService,
  ) { }

  ngOnInit(): void {
    this.getAllCandidatures()
  }

  getAllCandidatures(): void {
    console.log("Component: Loading candidatures - page:", this.currentPage, "size:", this.pageSize)

    this.loading = true

    this.candidatureService.getAllCandidatures(this.currentPage, this.pageSize).subscribe({
      next: (data) => {
        console.log("Component: DATA RECEIVED:", data)

        if (data && data.content) {
          // Set all the data properties
          this.candidatures = data.content
          this.allCandidatures = data.content
          this.pagedCandidatures = data.content // This is the key fix!

          this.totalPages = data.totalPages
          this.totalItems = data.totalElements

          console.log("Component: Processed data:", {
            candidatures: this.candidatures.length,
            pagedCandidatures: this.pagedCandidatures.length, // Add this for debugging
            totalPages: this.totalPages,
            totalItems: this.totalItems,
          })

          // Apply any active filters to the current page data
          this.applyFiltersToCurrentPage()
        } else {
          console.warn("Component: Unexpected data structure:", data)
          this.candidatures = []
          this.pagedCandidatures = []
          this.allCandidatures = []
        }

        this.loading = false
      },
      error: (err) => {
        console.error("Component: Error loading candidatures", err)
        this.candidatures = []
        this.pagedCandidatures = []
        this.allCandidatures = []
        this.loading = false
      },
    })
  }

  openSendChallengeModal(candidature: Candidature) {
    this.selectedCandidature = candidature;
    this.showSendChallengeModal = true;
    this.LoadChallenges();
  }

  LoadChallenges() {
    this.challengeService.getAllChallenges().subscribe({
      next: (challenges) => {
        this.challenges = challenges
      },
    })
  }

  sendChallengeToApplicant(challengeId: number) {
    if (this.selectedCandidature) {
      this.challengeService.envoyerDefiAuCandidat(this.selectedCandidature.id, challengeId).subscribe({
        next: (responseMessage) => {
          // The backend returns a success message string, so just proceed
          console.log("Défi envoyé avec succès!", responseMessage);
          alert("Challenge sent successfully!");
          this.showSendChallengeModal = false;
          this.selectedCandidature = null;

          // Refresh candidatures to show updated status
          this.LoadChallenges();
        },
        error: (error) => {
          console.error("Erreur lors de l'envoi du défi:", error);
          alert("Failed to send challenge. Please try again.");
        },
      });
    }
  }


  closeSendChallengeModal() {
    this.showSendChallengeModal = false
    this.selectedCandidature = null
  }

  // New method to apply filters to current page data
  applyFiltersToCurrentPage(): void {
    let filteredData = [...this.candidatures]

    // Apply global search filter
    if (this.globalFilterValue) {
      filteredData = filteredData.filter((c) => {
        const searchText =
          `${c.nom || ""} ${c.email || ""} ${c.statut || ""} ${c.offreEmploi?.titre || ""}`.toLowerCase()
        return searchText.includes(this.globalFilterValue.toLowerCase())
      })
    }

    // Apply status filters
    if (this.candidatureFilters.applicationStatus !== "all") {
      filteredData = filteredData.filter((c) => c.statut === this.candidatureFilters.applicationStatus)
    }

    if (this.candidatureFilters.challengeStatus !== "all") {
      filteredData = filteredData.filter((c) => (c.statutDefi || "AUCUN") === this.candidatureFilters.challengeStatus)
    }

    // Apply score range filter
    if (this.candidatureFilters.scoreRange !== "all") {
      const [min, max] = this.candidatureFilters.scoreRange.split("-").map(Number)
      filteredData = filteredData.filter((c) => {
        const score = c.scoreCV || 0
        return score >= min && score <= max
      })
    }

    this.pagedCandidatures = filteredData
    console.log("Applied filters, pagedCandidatures length:", this.pagedCandidatures.length)
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page
      this.getAllCandidatures()
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++
      this.getAllCandidatures()
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--
      this.getAllCandidatures()
    }
  }

  changePageSize(event: Event): void {
    const selectElement = event.target as HTMLSelectElement
    if (selectElement?.value) {
      const newSize = Number(selectElement.value)
      if (!isNaN(newSize) && newSize > 0) {
        this.pageSize = newSize
        this.currentPage = 0
        this.getAllCandidatures()
      }
    }
  }

  changePageSizeByValue(newSize: number): void {
    this.pageSize = newSize
    this.currentPage = 0
    this.getAllCandidatures()
  }

  // Filter methods - updated to work with server-side pagination
  applyFilter(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.globalFilterValue = input.value;
    this.applyFiltersToCurrentPage();
  }

  setCandidatureFilter(type: "applicationStatus" | "challengeStatus" | "scoreRange", value: string): void {
    this.candidatureFilters[type] = value
    this.applyFiltersToCurrentPage()
  }

  clearCandidatureFilters(): void {
    this.candidatureFilters = {
      applicationStatus: "all",
      challengeStatus: "all",
      scoreRange: "all",
    }
    this.globalFilterValue = ""
    this.applyFiltersToCurrentPage()
  }

  getFilteredCandidatures(): Candidature[] {
    return this.pagedCandidatures
  }

  // View and modal methods
  onView(candidature: Candidature): void {
    this.selectedCandidature = candidature
    this.showModal = true
  }

  openModal(): void {
    this.isModalOpen = true
  }

  closeModal(): void {
    this.showModal = false
    this.selectedCandidature = null
    this.isModalOpen = false
  }

  onDelete(id: number, cancelCallback: () => any = () => { }): void {
    const dialogRef = this.dialog.open(ConfirmCandidatureDialog, {
      width: "250px",
      data: { message: "hello", title: "Are you sure?" },
      autoFocus: true,
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.candidatureService.deleteCandidature(id).subscribe({
          next: () => {
            console.log(`candidature with id ${id} deleted successfully.`)
            this.getAllCandidatures()
          },
          error: (err) => {
            console.error("Error deleting candidature:", err)
          },
        })
      } else {
        cancelCallback()
      }
    })
  }

  // Utility methods
  getStatusColor(status: string): string {
    switch (status) {
      case "EN ATTENTE":
        return "#ffc107"
      case "ACCEPTÉ":
        return "#4caf50"
      case "REJETÉ":
        return "#f44336"
      default:
        return "#9e9e9e"
    }
  }

  changeStatus(candidature: Candidature, newStatus: "EN ATTENTE" | "ACCEPTÉ" | "REJETÉ"): void {
    const selectedId = this.route.snapshot.paramMap.get("id")
    const id = selectedId ? +selectedId : null
    const updatedCandidature = { ...candidature, statut: newStatus }

    if (id !== null) {
      this.candidatureService.updateCandidature(id, updatedCandidature).subscribe({
        next: (updated) => {
          candidature.statut = updated.statut
          this.editingId = null
        },
        error: (err) => {
          console.error("Error updating status", err)
        },
      })
    }
  }

  downloadAllCandidatures(): void {
    const allData = this.candidatures.map((c) => ({
      Nom: c.nom,
      Email: c.email,
      Téléphone: c.telephone,
      Lettre_de_motivation: c.coverLetter,
      Statut: c.statut,
      CV: `http://localhost:8089/uploads/${c.cv}`,
    }))

    const options = {
      fieldSeparator: ",",
      filename: "Toutes_les_Candidatures",
      quoteStrings: '"',
      decimalSeparator: ".",
      showLabels: true,
      useBom: true,
      headers: ["Nom", "Email", "Téléphone", "Lettre_de_motivation", "Statut", "CV"],
    }

    const csvExporter = new ExportToCsv(options)
    csvExporter.generateCsv(allData)
  }

  onPageChange(event: any): void {
    this.pageSize = event.pageSize
    this.currentPage = event.pageIndex
    this.getAllCandidatures()
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === "table" ? "card" : "table"
  }

  // Styling methods
  getCardStatusClass(application: any): string {
    switch (application.statut) {
      case "EN ATTENTE":
        return "card-pending"
      case "ACCEPTÉ":
        return "card-accepted"
      case "REJETÉ":
        return "card-rejected"
      default:
        return ""
    }
  }

  getScoreBadgeClass(score: number | undefined): string {
    if (score === undefined) return ""
    if (score >= 81) return "badge-success"
    if (score >= 61) return "badge-info"
    if (score >= 31) return "badge-warning"
    return "badge-danger"
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case "EN ATTENTE":
        return "chip-pending"
      case "ACCEPTÉ":
        return "chip-accepted"
      case "REJETÉ":
        return "chip-rejected"
      default:
        return ""
    }
  }

  getChallengeStatutClass(statutDefi: string): string {
    switch (statutDefi) {
      case "AUCUN":
        return "chip-challenge-none"
      case "ENVOYE":
        return "chip-challenge-sent"
      case "TERMINE":
        return "chip-challenge-done"
      case "EVALUE":
        return "chip-challenge-evaluated"
      default:
        return ""
    }
  }
  trackByCandidature(index: number, item: Candidature): any {
    return item.id;
  }
}

export class ConfirmCandidatureDialog {
  constructor(
    public dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onNoClick(): void {
    this.dialogRef.close(false)
  }

  onYesClick(): void {
    this.dialogRef.close(true)
  }
}
